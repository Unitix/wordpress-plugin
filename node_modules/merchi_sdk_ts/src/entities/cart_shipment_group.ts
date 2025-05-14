import { CartItem } from './cart_item.js';
import { CartShipmentQuote } from './cart_shipment_quote.js';
import { Entity } from '../entity.js';

export class CartShipmentGroup extends Entity {
  protected static resourceName = 'cart_shipment_groups';
  protected static singularName = 'cartShipmentGroup';
  protected static pluralName = 'cartShipmentGroups';

  @CartShipmentGroup.property()
  public id?: number;

  @CartShipmentGroup.property({arrayType: 'CartItem'})
  public cartItems?: CartItem[];

  @CartShipmentGroup.property({arrayType: 'CartShipmentQuote'})
  public quotes?: CartShipmentQuote[];

  @CartShipmentGroup.property({type: 'CartShipmentQuote'})
  public selectedQuote?: CartShipmentQuote;
}
