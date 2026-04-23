# Guía Práctica: ¿Cómo "Decorar" un Curso? (Añadir nuevas reglas de precio)

Si en el futuro necesitas agregar una nueva regla de negocio (por ejemplo, una "Promoción de Verano", un recargo por pago en cuotas, o un descuento por aniversario), **no tienes que tocar los componentes de React ni modificar la base de datos**. 

Gracias a nuestra arquitectura, solo debes seguir estos 2 pasos dentro de `src/patterns/PriceDecorator.js`:

---

### Paso 1: Crear la clase del nuevo Decorador
Al final del archivo (antes del Factory), crea una nueva clase que herede de `PriceDecorator`. Debes sobreescribir la matemática (`getPrice()`) y la línea de la factura (`getBreakdown()`).

```javascript
// Ejemplo: Promoción de Verano (Resta $10 a los cursos que cuesten más de $50)
export class SummerPromoDecorator extends PriceDecorator {
  
  getPrice() {
    const currentPrice = this.wrapped.getPrice();
    // Si el precio actual es mayor a 50, le restamos 10.
    return currentPrice > 50 ? currentPrice - 10 : currentPrice;
  }

  getBreakdown() {
    const currentPrice = this.wrapped.getPrice();
    
    // Si no aplica la promo, devolvemos la factura tal cual venía
    if (currentPrice <= 50) return this.wrapped.getBreakdown();

    // Si sí aplica, le "pegamos" esta nueva línea al desglose final
    return [
      ...this.wrapped.getBreakdown(),
      { reason: '☀️ Promo Especial de Verano (-$10)', amount: -10, type: 'promo' }
    ];
  }
}
```

---

### Paso 2: Conectarlo en el Factory (El Ensamblador)
Ve a la clase `PriceCalculatorFactory` y decide **en qué orden** quieres que se aplique tu nueva capa. 

```javascript
export class PriceCalculatorFactory {
  static calculateFinalPrice(basePrice, userProfile, hasCoupon = false) {
    let priceObject = new BasePrice(basePrice);

    if (basePrice > 0) {
      if (userProfile?.role === 'student') {
        priceObject = new StudentDiscountDecorator(priceObject, 0.15);
      }

      //  ¡AQUÍ PODEMOS APLICAR EL NUEVO DECORADOR!
      // Envolvemos el curso con la promo de verano antes de calcular los impuestos
      priceObject = new SummerPromoDecorator(priceObject);

      if (hasCoupon) {
        priceObject = new FlatCouponDecorator(priceObject, 15);
      }

      // Los impuestos siempre se cobran al final de todo
      priceObject = new TaxDecorator(priceObject, 0.12);
    }

    return priceObject; 
  }
}
```

---

### 🪄 El Resultado Mágico
Con solo haber hecho eso, toda la plataforma reaccionará automáticamente:
1. El número grande en las **Tarjetas del Catálogo** bajará de precio para todos los cursos mayores a $50.
2. El sistema dibujará una línea tachando el precio original y mostrando la oferta.
3. Al abrir el **Modal de Compra**, el recibo generará un nuevo ítem de color verde que dirá: *"☀️ Promo Especial de Verano (-$10)"*.

Todo esto sucede de forma dinámica e inteligente, manteniendo tu código de presentación (React) totalmente limpio y aislado de la lógica contable.
