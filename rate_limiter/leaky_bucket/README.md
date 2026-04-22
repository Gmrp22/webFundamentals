# Rate Limiting & JavaScript Async Deep Dive

Este proyecto contiene implementaciones experimentales del algoritmo **Leaky Bucket** escritas tanto en Python como en JavaScript puro (Node.js). El objetivo principal de este repositorio es entender cómo funciona la asincronía bajo el capó, limitar peticiones a un servidor, y gobernar correctamente el Event Loop de JavaScript.

## 1. El Algoritmo: Leaky Bucket
Un Rate Limiter es un mecanismo que frena el abuso o ataques de tráfico (ej. DDoS) limitando la cantidad de peticiones concurrentes hacia un servidor. Este algoritmo se define en 2 principios matemáticos que logramos codificar:

- **La Capacidad Cómoda (El Balde):** Si llegan decenas de peticiones de golpe (una ráfaga) y nuestro balde solo aguanta 5 o 10, las extras se descartan inmediatamente ("ignore request", y se devolvería un Error `429 Too Many Requests`). Esa es nuestra protección al inicio.
- **El Goteo (Salida Constante):** Independientemente de a qué velocidad torrencial hayan entrado las peticiones, el servidor siempre las procesará y sacará a un ritmo pausado y constante (ej. 2 peticiones procesadas cada 1 segundo). Esto salva a tus colas y bases de datos del estrés total. En la vida de servidores gigantescos esto hoy se calcula con "TimeStamps", sin embargo, recrearlo en ciclos nos enseñó como gobernar la RAM.

## 2. El peligro inminente: Bloquear el Event Loop en Javascript

Al venir de lenguajes o teorías síncronas, el primer error común en JavaScript es intentar detener el tiempo con un ciclo `while` clásico y un `setTimeout`:

```javascript
// ❌ ESTO EXPLOTA LA MEMORIA RAM (Error: Heap out of memory)
while(bucket.length > 0) {
    setTimeout(procesarCallbacks, 1000); 
}
```

### ¿Por qué Node.js colapsa al hacer eso?
A diferencia de lenguajes que levantan múltiples hilos multi-core, JavaScript tiene un solo hilo principal (el *Call Stack* de ejecución) operando absolutamente todo. 

Si tú ejecutas un `while(true)`, el Hilo Principal se atora allí a su 100% de ocupación. Como JavaScript obliga a que el hilo se vacíe antes de dejar que cualquier Callback (de un `setTimeout`) pueda empezar a correr, Node jamás procesa la acción deseada. Por consecuencia, el motor agenda millones de Cronómetros inejecutables en la fila de espera ("Task Queue"), colapsando el servidor para siempre (ni el while parará, ni ningún otro cliente web en el mundo será atendido).

## 3. ¿Cómo pausamos/controlamos rutinas correctamente?

Descubrimos dos métodos maravillosos y nativos (¡sin necesidad de librerías extrañas!) de evadir ese problema de CPU:

### La Vía A: El cronómetro del motor externo (`setInterval`)
La solución más natural cuando requieres que el servidor trabaje continuamente "en círculos". Evitamos escribir la palabra `while` a toda costa, y mejor encomendamos la tarea usando `setInterval`.

Al correr un `setInterval`, JavaScript nunca hace bucles infinitos en el Procesador; en cambio, le "delega" esa orden física al Sistema Operativo mediante puentes de C++ (ej. la librería `libuv` de Node.js). JavaScript vuelve a quedar libre en un milisegundo y el OS lo sacudirá de nuevo cuando el tiempo se cumpla.

```javascript
// ✅ Código perfecto y seguro 
let reloj = setInterval(() => {
    // Extraemos tareas sin bloquear (ej. splice)
    
    // Una vez limpiado el trabajo, nos anulamos usando la propia memoria 
    if(huboVictoria) clearInterval(reloj);
}, 1000);
```

### La Vía B: Domesticando al `while` (`async \/ await` con Promesas)
Si realmente deseas la legibilidad síncrona visual que te da tener un bucle `while()`, debes obligar a la función a **cederle el control** al Event Loop creando tú mismo una Promesa artificial alrededor de un `setTimeout` clásico, engañando al compilador.

```javascript
// La promesa custom actúa como candado bloqueando momentaneamente únicamente esta función.
async function processRequests() {
    return new Promise((resolver) => {
        setTimeout(() => {
            bucket.splice(0, rate); 
            resolver(); // <--- Manda a abrir el candado al tiempo esperado
        }, 1000);
    });
}
```

Ahora en nuestra rutina superior podemos escribir el tan temido `while()`, porque ese `await` sí significa literalmente *"Apaga esta función, devuelve la energía procesante a otros clientes web y despiértate cuando alguien ejecute `resolver()`"*.

```javascript
// ✅ Ya no interfiere con la salud del servidor
async function main() {
    while(bucket.length > 0) {
        await processRequests();
    }
}
```

---
### Resumen de Preguntas Frecuentes
1. **¿`splice(0, 2)` en JS es lo mismo que el slice `[:2]` de Python?**  
   Falso. El `slice()` de JS (o el `[:2]` de Python) devuelve una cómoda "fotocopia" read-only de tu arreglo. La función **`splice(0, 2)`** en JS, en cambio, es altamente *destructiva*. Amputa brutalmente tu arreglo original sacándolo de la lista y te lo devuelve. Su contra-parte en Python sería `del list[:2]`.
   
2. **¿El `time.sleep(1)` en Python y las promesas de retardo en Node.js son equivalentes?**  
   Sirven para el humano igual, pero para el hardware no. En el Python de facto, el Sleep detiene TODO el hilo procesador por el que estás fluyendo. En los ecosistemas modernos de JavaScript (apoyados de asincronía) esas pausas artificiales son "Non-Blocking", el único lugar donde corre la pausa es en esa función individual, pero la computadora y tu código alrededor siguen su día libres y sin amarrarse.
