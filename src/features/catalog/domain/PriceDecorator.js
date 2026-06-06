// ====================================================================
// 🎁 PATRÓN DECORATOR + FACTORY - Calculadora de Precios y Descuentos
// ====================================================================
// El Decorador permite aplicar impuestos, cupones y descuentos 
// apilando "envoltorios" sobre un precio base sin usar if/else complejos.
// El Factory se encarga de armar la hamburguesa de decoradores.
// ====================================================================

// 1. COMPONENT (Interfaz base para todo elemento que represente un precio)
export class CoursePrice {
  getPrice() { throw new Error('Debe implementarse'); }
  getBreakdown() { throw new Error('Debe implementarse'); }
}

// 2. CONCRETE COMPONENT (El objeto central: El precio crudo de la DB)
export class BasePrice extends CoursePrice {
  constructor(rawPrice) {
    super();
    this.price = Number(rawPrice) || 0;
  }
  getPrice() { return this.price; }
  getBreakdown() { 
    return [{ reason: 'Precio original del curso', amount: this.price, type: 'base' }]; 
  }
}

// 3. BASE DECORATOR (La envoltura genérica que delega el trabajo al interior)
export class PriceDecorator extends CoursePrice {
  constructor(coursePriceWrapper) {
    super();
    this.wrapped = coursePriceWrapper; // ⬅️ Referencia al objeto envuelto
  }
  getPrice() { return this.wrapped.getPrice(); }
  getBreakdown() { return this.wrapped.getBreakdown(); }
}

// 4. CONCRETE DECORATORS (Comportamientos específicos que alteran el precio)

// 4A. Impuestos (Añade un porcentaje)
export class TaxDecorator extends PriceDecorator {
  constructor(coursePriceWrapper, taxRate = 0.12) {
    super(coursePriceWrapper);
    this.taxRate = taxRate;
  }

  getPrice() {
    return this.wrapped.getPrice() * (1 + this.taxRate);
  }

  getBreakdown() {
    const baseAmount = this.wrapped.getPrice();
    const taxAmount = baseAmount * this.taxRate;
    return [
      ...this.wrapped.getBreakdown(),
      { reason: `Impuestos Nacionales (${this.taxRate * 100}%)`, amount: taxAmount, type: 'tax' }
    ];
  }
}

// 4B. Descuento Estudiantil (Resta un porcentaje)
export class StudentDiscountDecorator extends PriceDecorator {
  constructor(coursePriceWrapper, discountRate = 0.15) {
    super(coursePriceWrapper);
    this.discountRate = discountRate;
  }

  getPrice() {
    return this.wrapped.getPrice() * (1 - this.discountRate);
  }

  getBreakdown() {
    const baseAmount = this.wrapped.getPrice();
    const discountAmount = -(baseAmount * this.discountRate);
    return [
      ...this.wrapped.getBreakdown(),
      { reason: 'Descuento Especial Beca (15%)', amount: discountAmount, type: 'discount' }
    ];
  }
}

// 4C. Cupón de monto fijo (Resta $X cantidad)
export class FlatCouponDecorator extends PriceDecorator {
  constructor(coursePriceWrapper, amountOff = 15) {
    super(coursePriceWrapper);
    this.amountOff = amountOff;
  }

  getPrice() {
    const newPrice = this.wrapped.getPrice() - this.amountOff;
    return newPrice > 0 ? newPrice : 0; // Evitar precios negativos
  }

  getBreakdown() {
    return [
      ...this.wrapped.getBreakdown(),
      { reason: 'Cupón de Regalo (-$15)', amount: -this.amountOff, type: 'coupon' }
    ];
  }
}

// ====================================================================
// 5. THE FACTORY (El Ensamblador)
// Construye la cadena de decoradores evaluando el contexto del usuario.
// ====================================================================
export class PriceCalculatorFactory {
  static calculateFinalPrice(basePrice, userProfile, hasCoupon = false) {
    // Capa 0: Iniciamos con el precio crudo de la base de datos
    let priceObject = new BasePrice(basePrice);

    // Solo se aplican beneficios y cobros extra si el precio base es > 0
    if (basePrice > 0) {
      // Capa 1: Si es estudiante, lo envolvemos con el descuento del 15%
      if (userProfile?.role === 'student') {
        priceObject = new StudentDiscountDecorator(priceObject, 0.15);
      }

      // Capa 2: Si el usuario activó un cupón extra, envolvemos con -$15
      if (hasCoupon) {
        priceObject = new FlatCouponDecorator(priceObject, 15);
      }

      // Capa 3: Finalmente, SIEMPRE envolvemos con el Impuesto País sobre el subtotal
      priceObject = new TaxDecorator(priceObject, 0.12);
    }

    return priceObject; // Devolvemos la cebolla de decoradores lista para usarse
  }
}
