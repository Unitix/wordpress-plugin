import { generateUUID } from './uuid.js';
import { addPropertyTo } from './model.js';
import { Domain } from './domain.js';
import { Product } from './product.js';


export function DiscountGroup() {
    this.resource = '/discountGroups';
    this.json = 'discountGroup';
    this.temporaryId = generateUUID();

    addPropertyTo(this, 'id');
    addPropertyTo(this, 'created');
    addPropertyTo(this, 'dateStart');
    addPropertyTo(this, 'dateEnd');
    addPropertyTo(this, 'created');
    addPropertyTo(this, 'discountType');
    addPropertyTo(this, 'discounts');
    addPropertyTo(this, 'name');
    addPropertyTo(this, 'domain', Domain);
    addPropertyTo(this, 'product', Product);
}
