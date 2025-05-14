import { generateUUID } from './uuid.js';
import { addPropertyTo } from './model.js';
import { Cart } from './cart.js';
import { CountryTax } from './country_tax.js';
import { Discount } from './discount.js';
import { Invoice } from './invoice.js';
import { Job } from './job.js';

export function Item() {
    this.resource = '/items';
    this.json = 'items';
    this.temporaryId = generateUUID();

    addPropertyTo(this, 'id');
    addPropertyTo(this, 'code');
    addPropertyTo(this, 'quantity');
    addPropertyTo(this, 'cart', Cart);
    addPropertyTo(this, 'taxType', CountryTax);
    addPropertyTo(this, 'discount', Discount);
    addPropertyTo(this, 'invoice', Invoice);
    addPropertyTo(this, 'job', Job);
    addPropertyTo(this, 'taxAmount');
    addPropertyTo(this, 'cost');
    addPropertyTo(this, 'description');

    this.totalCost = function () {
        var quantity = this.quantity() ? this.quantity() : 0,
            cost = this.cost() ? this.cost() : 0;
      return quantity * cost;
    }
}
