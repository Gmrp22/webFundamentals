# Rate Limiting & JavaScript/Python Async Deep Dive

Este proyecto contiene implementaciones experimentales del algoritmo **Leaky Bucket** escritas tanto en Python como en JavaScript puro (Node.js). El objetivo principal de este repositorio es entender cómo funciona la asincronía bajo el capó, limitar peticiones a un servidor, y gobernar correctamente el Event Loop tanto en lenguajes síncronos como asíncronos.

## 1. El Algoritmo: Leaky Bucket
Un Rate Limiter es un mecanismo que frena el abuso o ataques de tráfico (ej. DDoS) limitando la cantidad de peticiones concurrentes hacia un servidor. Este algoritmo se define en 2 principios matemáticos que logramos codificar:

- **La Capacidad Cómoda (El Balde):** Si llegan decenas de peticiones de golpe (una ráfaga) y nuestro balde solo aguanta 5 o 10, las extras se descartan inmediatamente ("ignore request").
- **El Goteo (Salida Constante):** Independientemente de la velocidad torrencial, el servidor las procesará y sacará a un ritmo pausado y constante (ej. 2 por segundo). Esto salva a tus colas y bases de datos del estrés total.

## 2. El peligro inminente: Bloquear el Event Loop en Javascript

Al intentar detener el tiempo con un ciclo `while` clásico y un `setTimeout`:

```javascript
// ❌ ESTO EXPLOTA LA MEMORIA RAM (Error: Heap out of memory)
while(bucket.length > 0) {
    setTimeout(procesarCallbacks, 1000); 
}
```

**¿Por qué Node.js colapsa?**
JavaScript tiene un solo hilo principal (Call Stack). Si tú ejecutas un `while(true)`, el Hilo Principal se atora allí a su 100%. Como JavaScript obliga a que el hilo se vacíe antes de dejar que cualquier Callback pueda entrar a correr, Node jamás procesa la acción deseada. Por consecuencia, el motor agenda millones de Cronómetros inejecutables en la fila de espera, colapsando el servidor y consumiendo toda la RAM entera.

## 3. Asincronía en JavaScript
Descubrimos dos métodos nativos para pausar bucles sin bloquear el Event Loop:

### A) El cronómetro del motor externo (`setInterval`)
Al correr un `setInterval`, JavaScript nunca hace bucles en el Procesador; le "delega" esa orden física al Sistema Operativo mediante puentes de C++ (ej. `libuv`). JavaScript vuelve a quedar libre y se va a sentar mientras el OS hace el trabajo sucio anotando el cronómetro.

### B) Domesticando al `while` (`async \/ await` con Promesas)
Si deseas forzar pausas limpias en un `while`, debes obligar a la función a **cederle el control** creando una Promesa alrededor:
```javascript
async function processRequests() {
    return new Promise((resolver) => {
        setTimeout(() => { bucket.splice(0, rate); resolver(); }, 1000);
    });
}
// Ahora await processRequests(); es totalmente seguro en un while.
```

## 4. La Gran Diferencia Asíncrona: Python (`asyncio`)

A diferencia de JavaScript, el comportamiento asíncrono de Python no está encendido mágicamente desde fábrica. 

### Diferencias Clave de Diseño:
1. **Es síncrono por defecto:** El Event Loop asíncrono de Python está **apagado y guardado en una caja**. Nace para ejecutar código lineal (bloqueante). 
2. **Prendiendo el Reproductor:** Definir una función `async def main():` solo crea el "disco" de la película. Si no "prendes el reproductor del Event Loop" manualmente, Python tira el disco a la basura sin correrlo. Para prender el Event Loop tú mismo usas la orden maestra: `asyncio.run(main())`.
3. **El estricto `await`:** En JS, si llamas a una Promesa pero olvidas poner el `await`, la promesa como quiera corre sola en el fondo. En Python, si pones un `asyncio.sleep(1)` y se te olvida ponerle la palabra `await` en frente, *Python desecha la corrutina ignorándola por completo al instante.*

### El Equivalente Sano en Python
Así se logra exactamente el mismo "goteo sano asíncrono" que logramos en Node pero prendiendo el Event Loop en Python:

```python
async def processRequest():
    await asyncio.sleep(1) # Oportunidad crítica de soltar el Hilo Principal y cederlo
    del bucket[:2]

async def main():
    while len(bucket) > 0:
        await processRequest()

# ¡LA LLAVE DE IGNICIÓN NECESARIA!
asyncio.run(main())
```

---
### Preguntas Frecuentes Curiosas
1. **¿`splice(0, 2)` en JS es lo mismo que el slice `[:2]` de Python?**  
   Falso. El `slice()` de JS (o el `[:2]` de Python) es *read-only*. La función **`splice(0, 2)`** en JS, en cambio, es altamente *destructiva*. Amputa brutalmente tu arreglo original sacando el elemento, esto lo vuelve el equivalente a `del list[:2]` en Python.
2. **¿El `time.sleep(1)` tradicional y el `asyncio.sleep(1)` en Python son iguales?**  
   Para nada. El clásico `time.sleep(1)` es TOTALMENTE BLOQUEANTE, paraliza por un segundo todo el Procesador del programa. `asyncio.sleep(1)` es la versión Non-Blocking ASÍNCRONA, que es la única capaz de suspender solo la función actual enviándole un post-it al Event Loop para que atienda a las demás peticiones mientras termina de correr el segundo.
