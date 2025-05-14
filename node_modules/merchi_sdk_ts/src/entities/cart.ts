import { Address } from './address.js';
import { CartItem } from './cart_item.js';
import { CartShipmentGroup } from './cart_shipment_group.js';
import { Company } from './company.js';
import { Domain } from './domain.js';
import { Entity } from '../entity.js';
import { Invoice } from './invoice.js';
import { User } from './user.js';
import { Item } from './item.js';

export class Cart extends Entity {
  protected static resourceName = 'carts';
  protected static singularName = 'cart';
  protected static pluralName = 'carts';

  @Cart.property({type: Date})
  public archived?: Date | null;

  @Cart.property()
  public id?: number;

  @Cart.property()
  public creationDate?: Date;

  @Cart.property({type: Date})
  public ip?: string | null;

  @Cart.property({type: String})
  public token?: string | null;

  @Cart.property({type: String})
  public receiverNotes?: string | null;

  @Cart.property()
  public currency?: string;

  @Cart.property()
  public cartItemsSubtotalCost?: number;

  @Cart.property()
  public cartItemsTaxAmount?: number;

  @Cart.property()
  public cartItemsTotalCost?: number;

  @Cart.property()
  public shipmentTotalCost?: number;

  @Cart.property()
  public subtotalCost?: number;

  @Cart.property()
  public taxAmount?: number;

  @Cart.property()
  public totalCost?: number;

  @Cart.property({type: 'User'})
  public client?: User | null;

  @Cart.property({type: Company})
  public clientCompany?: Company | null;

  @Cart.property()
  public domain?: Domain;

  @Cart.property({type: 'Invoice'})
  public invoice?: Invoice | null;

  @Cart.property({type: Address})
  public receiverAddress?: Address | null;

  @Cart.property({arrayType: 'Item'})
  public discountItems?: Item[];

  @Cart.property({arrayType: 'CartItem'})
  public cartItems?: CartItem[];

  @Cart.property({arrayType: 'CartShipmentGroup'})
  public shipmentGroups?: CartShipmentGroup[];

  public requiresShipment = () => {
    if (this.cartItems === undefined) {
      throw 'cartItems is undefined, did you forget to embed it?';
    }
    for (const cartItem of this.cartItems) {
      if (cartItem.requiresShipment()) {
        return true;
      }
    }
    return false;
  };
}
