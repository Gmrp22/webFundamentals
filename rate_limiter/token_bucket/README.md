# Token Bucket y el Event Loop (Node.js & Python)

Este documento es un resumen de maestría sobre los conceptos avanzados de Rate Limiting y la arquitectura del motor de asincronía en lenguajes de servidor (JavaScript V8 / Python Asyncio).

---

## 1. Rate Limiters: Leaky Bucket vs Token Bucket

Existen dos estrategias principales para limitar peticiones (API rate limit). Aunque parezcan iguales, su diferencia clave es cómo reaccionan ante las **ráfagas** de usuarios (*bursts*):

### 💧 Leaky Bucket (El de la paciencia estricta)
- **Almacena:** Peticiones de usuarios.
- **Funcionamiento:** Suaviza el tráfico de salida actuando como un embudo estricto. Si llegan 50 peticiones de golpe (ráfaga) y el balde tiene capacidad, se guardan, pero se van a procesar de una por una a un ritmo *"gotita a gotita"* inquebrantable. Nunca procesará más rápido que su límite por segundo. El sobrante se tira.

### 🪙 Token Bucket (El que permite Ráfagas)
- **Almacena:** Monedas (Tokens).
- **Funcionamiento:** Rellena el balde con tokens a un ritmo constante. Si la API no recibe visitas, el balde se llena. Cuando por fin llega un usuario y tira 5 peticiones simultáneas, **las 5 se procesan de manera instantánea** (robando 5 tokens de golpe). Es permisivo y veloz si hay monedas disponibles; si no, rebota las peticiones al instante.

*(En nuestras pruebas de código, la velocidad de ambos algoritmos dependía puramente de equilibrar la generación vs la extracción).*

---

## 2. El Event Loop y la Magia de `await` (Anatomía Nivel Experto)

La asincronía real ocurre en múltiples actores:
1. **V8 (JavaScript):** Dirige la lógica y administra el código (síncrono).
2. **`libuv` (C++):** Hace el trabajo pesado de fondo (esperar temporizadores, descargas, red).
3. **Event Loop:** El guardia de seguridad que acomoda todo de regreso.

### La línea de tiempo a velocidad Microsegundo
Cuando escribes `await something()`, esto es exactamente lo que ocurre internamente, paso a paso:

1. **V8 entra en acción y evalúa la derecha:** El código siempre evalúa lo que está a la derecha del `await` primero. V8 entra síncronamente a la función `something()`.
2. **Creación y Delegación:** V8 genera en el Heap de Memoria una Promesa en estado `Pendiente`. Síncronamente le delega la tarea a `libuv` (ej: *"cuenta 1 segundo y avísame"*). **`libuv` comienza a temporizar DE INMEDIATO.**
3. **Retorno Síncrono:** La función termina de declarar instrucciones y le devuelve a V8 la Promesa vacía y Pendiente.
4. **El Registro Instantáneo (`await` entra al juego):** El motor ahora llega al `await`, ve la Promesa, y empaca todo el código que sobraba debajo de él disfrazándolo de función (callback). Guarda ese callback en un arreglo secreto dentro del objeto Promesa, escondido en la Memoria (Heap). 
5. **Vacío del Stack:** El hilo principal hace `return` y **deja el Call Stack completamente libre**. V8 se va a dormir (o ayudar a otras funciones).
6. **(Pasa el tiempo...)**
7. **La orden de despertar:** `libuv` finalmente acaba la cuenta, toca la campana y dispara la señal para que V8 sepa que ya está lista, invocando al método `resolve()`.
8. **La Promesa cambia de estado:** Pasa de `Pendiente` a `Cumplida / Resuelta`.
9. **El Salto a la Cola VIP:** La Promesa voltea a su memoria interna, ve el callback que habíamos guardado en el paso 4, y lo arroja de golpe a la **Microtask Queue** (la fila VIP).
10. **El Remate Final:** El Event Loop ve que la Microtask Queue tiene formados, agarra el callback, lo sube al Call Stack, y el resto del código termina de ejecutarse.

Todo el `await` fue una ilusión óptica (syntactic sugar) para hacer un `.then(callback)` escondido.

---

## 3. Traducción a Python (Asyncio)

Aunque en Javascript el Event Loop con temporizadores es inherente al lenguaje (mediante `libuv` y `setInterval`), Python maneja un modelo distinto pero arquitectónicamente idéntico.

- En Python **no existe** `setInterval()`. 
- Para un proceso cíclico eterno ("interval"), usamos un ciclo infinito `while True` con un `await asyncio.sleep(segundos)`.
- Igual que en Node, llamar a `await asyncio.sleep()` NO bloquea el programa. Simplemente retorna control al Event Loop (usando `epoll/kqueue` bajo el capó), permitiendo que múltiples corrutinas (`token_interval` y `process_interval`) corran fluidas al mismo tiempo, lanzadas por `asyncio.create_task()`.

> **Nota Final sobre el "Error" en Terminal:** 
> Cuando tu servidor o ciclo en Python está corriendo perfectamente en un `while True`, y tú presionas `Ctrl + C` para detenerlo, Python escupe mucha basura roja en tu consola que dice **`KeyboardInterrupt`**.  
> ¡**No bugs!** Solamente significa *"Mi usuario cortó violentamente mi flujo perfecto de ejecución"*. Es el comportamiento correcto y esperado.
