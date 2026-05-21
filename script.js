class ScanlineFill {

    /**
     * Constructor
     *
     * @param {CanvasRenderingContext2D} ctx
     *        Contexto 2D del canvas donde se dibujará.
     */
    constructor(ctx) {
        this.ctx = ctx;
    }

    /**
     * --------------------------------------------------------
     * MÉTODO PRINCIPAL
     * --------------------------------------------------------
     *
     * Ejecuta el algoritmo scanline fill.
     *
     * @param {Array} polygon
     *        Array de vértices del polígono.
     *
     * @param {String} color
     *        Color de relleno.
     */
    fill(polygon, color = "black") {

        // ====================================================
        // 1. CONSTRUIR EDGE TABLE (ET)
        // ====================================================
        //
        // La Edge Table organiza las aristas según
        // la coordenada Y mínima de cada una.
        //
        // ET[y] = lista de aristas que comienzan en y
        //
        // Cada arista guarda:
        //   - ymax
        //   - x inicial
        //   - invSlope
        //
        // ====================================================

        const edgeTable = {};

        const n = polygon.length;

        for (let i = 0; i < n; i++) {

            // Punto actual
            const p1 = polygon[i];

            // Siguiente punto (cerrando el polígono)
            const p2 = polygon[(i + 1) % n];

            // ------------------------------------------------
            // IGNORAR LÍNEAS HORIZONTALES
            // ------------------------------------------------
            //
            // Las líneas horizontales no generan
            // intersecciones útiles para scanline fill.
            //
            // Además producen duplicados ambiguos.
            //
            // ------------------------------------------------
            if (p1.y === p2.y) {
                continue;
            }

            // ------------------------------------------------
            // IDENTIFICAR:
            //   ymin
            //   ymax
            //
            // La arista se procesa desde abajo hacia arriba.
            // ------------------------------------------------
            let ymin, ymax, xAtYmin, invSlope;

            if (p1.y < p2.y) {

                ymin = p1.y;
                ymax = p2.y;

                xAtYmin = p1.x;

                // dx/dy
                invSlope = (p2.x - p1.x) / (p2.y - p1.y);

            } else {

                ymin = p2.y;
                ymax = p1.y;

                xAtYmin = p2.x;

                invSlope = (p1.x - p2.x) / (p1.y - p2.y);
            }

            // Crear bucket si no existe
            if (!edgeTable[ymin]) {
                edgeTable[ymin] = [];
            }

            // Insertar arista
            edgeTable[ymin].push({
                ymax,
                x: xAtYmin,
                invSlope
            });
        }

        // ====================================================
        // 2. OBTENER RANGO VERTICAL TOTAL
        // ====================================================

        const ys = polygon.map(p => p.y);

        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        // ====================================================
        // 3. ACTIVE EDGE TABLE (AET)
        // ====================================================
        //
        // Contendrá SOLO las aristas activas
        // para la scanline actual.
        //
        // ====================================================

        let activeEdgeTable = [];

        // Color de dibujo
        this.ctx.fillStyle = color;

        // ====================================================
        // 4. RECORRER SCANLINES
        // ====================================================
        //
        // Se procesa línea por línea.
        //
        // ====================================================

        for (let y = minY; y <= maxY; y++) {

            // ------------------------------------------------
            // 4.1 AGREGAR NUEVAS ARISTAS ACTIVAS
            // ------------------------------------------------
            //
            // Si alguna arista comienza en esta Y,
            // se agrega a la AET.
            //
            // ------------------------------------------------

            if (edgeTable[y]) {
                activeEdgeTable.push(...edgeTable[y]);
            }

            // ------------------------------------------------
            // 4.2 ELIMINAR ARISTAS TERMINADAS
            // ------------------------------------------------
            //
            // Una arista deja de ser activa cuando
            // llegamos a ymax.
            //
            // ------------------------------------------------

            activeEdgeTable = activeEdgeTable.filter(
                edge => edge.ymax > y
            );

            // ------------------------------------------------
            // 4.3 ORDENAR POR X
            // ------------------------------------------------
            //
            // Necesitamos las intersecciones de izquierda
            // a derecha.
            //
            // ------------------------------------------------

            activeEdgeTable.sort((a, b) => a.x - b.x);

            // ------------------------------------------------
            // 4.4 RELLENAR ENTRE PARES
            // ------------------------------------------------
            //
            // Tomamos:
            //
            //   [0] con [1]
            //   [2] con [3]
            //   etc.
            //
            // ------------------------------------------------

            for (let i = 0; i < activeEdgeTable.length; i += 2) {

                // Seguridad ante polígonos inválidos
                if (i + 1 >= activeEdgeTable.length) {
                    break;
                }

                // Intersección izquierda
                const xStart = Math.ceil(activeEdgeTable[i].x);

                // Intersección derecha
                const xEnd = Math.floor(activeEdgeTable[i + 1].x);

                // --------------------------------------------
                // Dibujar línea horizontal
                // --------------------------------------------
                //
                // fillRect(x, y, width, height)
                //
                // Altura = 1 píxel
                //
                // --------------------------------------------

                this.ctx.fillRect(
                    xStart,
                    y,
                    xEnd - xStart + 1,
                    1
                );
            }

            // ------------------------------------------------
            // 4.5 ACTUALIZAR INTERSECCIONES X
            // ------------------------------------------------
            //
            // La scanline baja 1 unidad en Y.
            //
            // Entonces:
            //
            //      x += dx/dy
            //
            // Esto evita recalcular:
            //
            //      x = x0 + m(y-y0)
            //
            // haciendo el algoritmo MUCHO más rápido.
            //
            // ------------------------------------------------

            for (const edge of activeEdgeTable) {
                edge.x += edge.invSlope;
            }
        }
    }
}

/**
 * ============================================================
 * EJEMPLO DE USO
 * ============================================================
 */

// Obtener canvas
const canvas = document.getElementById("canvas");

// Contexto 2D
const ctx = canvas.getContext("2d");

// LIMPIAR CANVAS 
ctx.clearRect(0, 0, canvas.width, canvas.height);

// Crear instancia
const scanline = new ScanlineFill(ctx);

// ============================================================
// DEFINIR POLÍGONO
// ============================================================
//
// Puede ser convexo o cóncavo.
//
// ============================================================

const polygon = [
    { x: 100, y: 100 },
    { x: 300, y: 120 },
    { x: 350, y: 250 },
    { x: 250, y: 350 },
    { x: 120, y: 300 }
];

const isValidPolygon = polygon.every(point =>
    point.x >= 0 &&
    point.x <= canvas.width &&
    point.y >= 0 &&
    point.y <= canvas.height
);

if (!isValidPolygon) {
    console.error("El poligono contiene coordenadas fuera del canvas");
}

// ============================================================
// DIBUJAR CONTORNO
// ============================================================

ctx.beginPath();

ctx.moveTo(polygon[0].x, polygon[0].y);

for (let i = 1; i < polygon.length; i++) {
    ctx.lineTo(polygon[i].x, polygon[i].y);
}

ctx.closePath();

ctx.strokeStyle = "red";
ctx.lineWidth = 2;
ctx.stroke();

// ============================================================
// APLICAR SCANLINE FILL
// ============================================================

scanline.fill(polygon, "skyblue");

/**
 * ============================================================
 * COMPLEJIDAD TEMPORAL
 * ============================================================
 *
 * Construcción ET:
 *      O(n)
 *
 * Procesamiento scanlines:
 *      Aproximadamente O(h + k)
 *
 * donde:
 *      h = altura del polígono
 *      k = número de intersecciones
 *
 * ============================================================
 * PROBLEMAS CLÁSICOS
 * ============================================================
 *
 * 1. VÉRTICES COMPARTIDOS
 * ------------------------------------------------------------
 * Un vértice puede producir doble conteo.
 *
 * La solución clásica:
 *   incluir ymax excluyente.
 *
 * Por eso usamos:
 *
 *      edge.ymax > y
 *
 * y NO:
 *
 *      edge.ymax >= y
 *
 * ============================================================
 *
 * 2. LÍNEAS HORIZONTALES
 * ------------------------------------------------------------
 * Se ignoran para evitar ambigüedades.
 *
 * ============================================================
 *
 * 3. POLÍGONOS AUTOINTERSECTADOS
 * ------------------------------------------------------------
 * El algoritmo estándar puede producir resultados
 * inesperados.
 *
 * ============================================================
 * USOS REALES
 * ============================================================
 *
 * - Rasterización de polígonos
 * - Motores gráficos
 * - OpenGL clásico
 * - Renderizado 2D
 * - CAD
 * - Videojuegos retro
 *
 * ============================================================
 */
