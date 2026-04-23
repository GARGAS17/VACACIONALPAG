# Patrón Decorator + Factory (Motor de Precios)

## Contexto
En un LMS real, el precio final de un curso rara vez es el "precio crudo" de la base de datos. Existen variables como: descuentos por ser estudiante, códigos de cupones, e impuestos gubernamentales (IVA). Si intentamos programar todo esto en el componente React, terminamos con una espiral de sentencias `if/else` que rompen el principio de "Single Responsibility" (Responsabilidad Única) y son imposibles de mantener.

## ¿Qué se hizo exactamente?
Implementamos el **Patrón Decorator** envuelto por un **Factory Method**. 
El Decorator nos permite tomar el `Precio Base` y envolverlo dinámicamente en múltiples "capas" independientes (Capa Impuestos, Capa Descuento). Cuando pedimos el precio final o la factura desglosada, la petición atraviesa todas las capas, calculándose sola.

---

## Archivos Involucrados

| Tipo | Archivo Modificado/Creado |
| :--- | :--- |
| **Patrón Lógico (NUEVO)** | `src/patterns/PriceDecorator.js` |
| **Consumidor UI** | `src/pages/Catalog.jsx` (Modificados la Tarjeta y el Modal) |

---

## El Código (Sistema de Precios Dinámico)

### ANTES (Código Estático)
El Front-End simplemente leía y pintaba el número crudo sin flexibilidad.

```javascript
/* src/pages/Catalog.jsx */
// En la tarjeta o el Modal:
<div className="course-price">$ US$ {course.price}</div>
```

### DESPUÉS (Arquitectura Flexible y Desglosada)

#### 1. Los Decoradores y el Factory
Creamos envoltorios aislados. Si la lógica de impuestos cambia mañana, solo tocamos el `TaxDecorator`.

```javascript
/* src/patterns/PriceDecorator.js */

// 1. Objeto Base
export class BasePrice extends CoursePrice {
  getPrice() { return this.price; } // Ej: 100
}

// 2. Decorador de Impuestos (Suma)
export class TaxDecorator extends PriceDecorator {
  getPrice() { return this.wrapped.getPrice() * 1.12; } // Ej: 100 * 1.12 = 112
}

// 3. Decorador de Descuentos (Resta)
export class StudentDiscountDecorator extends PriceDecorator {
  getPrice() { return this.wrapped.getPrice() * 0.85; } // Ej: 100 * 0.85 = 85
}

// 4. El Factory que ensambla todo según el usuario
export class PriceCalculatorFactory {
  static calculateFinalPrice(basePrice, userProfile) {
    let price = new BasePrice(basePrice);
    
    if (userProfile?.role === 'student') {
      price = new StudentDiscountDecorator(price); // Envolvemos en descuento
    }
    
    price = new TaxDecorator(price); // Envolvemos en impuestos
    
    return price;
  }
}
```

#### 2. El Frontend (Recibo Profesional)
En React, ya no pintamos un número, le pedimos al objeto decorado su "desglose".

```javascript
/* src/pages/Catalog.jsx (AHORA en el Modal) */
import { PriceCalculatorFactory } from '../patterns/PriceDecorator';

{(() => {
  // 1. Llamamos al motor con los datos del curso y el usuario
  const finalPriceObj = PriceCalculatorFactory.calculateFinalPrice(selectedCourse.price, profile, false);
  
  // 2. Pedimos el resumen detallado (Generado por los decoradores)
  const breakdown = finalPriceObj.getBreakdown();
  
  return (
    <div>
      <h4>Resumen de Pago</h4>
      {breakdown.map((item) => (
        <div>{item.reason}: ${item.amount}</div>
      ))}
      <h3>Total: ${finalPriceObj.getPrice()}</h3>
    </div>
  );
})()}
```

## 🚀 Beneficios Alcanzados
- **Escalabilidad Vectorial:** Si mañana necesitas añadir una lógica de "Precio Especial de Verano", solo creas un archivo `SummerDecorator.js`. No tienes que reescribir ni testear de nuevo las lógicas de impuestos o descuentos. Todo se apila como piezas de Lego.
- **Transparencia UI:** Al delegar la función `getBreakdown()` en las propias capas del decorador, la UI de React se vuelve increíblemente inteligente, pudiendo generar "Facturas" o "Recibos" detallados en tiempo real sin cálculos en el Front-End.
