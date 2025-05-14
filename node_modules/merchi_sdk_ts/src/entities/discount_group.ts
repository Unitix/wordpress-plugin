import { Entity } from '../entity.js';
import { Domain } from './domain.js';
import { Product } from './product.js';
import { Discount } from './discount.js';

export class DiscountGroup extends Entity {
  protected static resourceName = 'discount_groups';
  protected static singularName = 'discountGroup';
  protected static pluralName = 'discountGroups';

  @DiscountGroup.property({type: Date})
  public archived?: Date | null;

  @DiscountGroup.property({type: Date})
  public created?: Date | null;

  @DiscountGroup.property()
  public id?: number;

  @DiscountGroup.property({type: Date})
  public dateStart?: Date | null;

  @DiscountGroup.property({type: Date})
  public dateEnd?: Date | null;

  @DiscountGroup.property()
  public discountType?: number;

  @DiscountGroup.property({arrayType: 'Discount'})
  public discounts?: Discount[];

  @DiscountGroup.property()
  public name?: string;

  @DiscountGroup.property()
  public groupRestricted?: boolean;

  @DiscountGroup.property({type: 'Product'})
  public product?: Product | null;

  @DiscountGroup.property({type: 'Domain'})
  public domain?: Domain | null;
}
