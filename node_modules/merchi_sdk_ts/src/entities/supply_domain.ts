import { Domain } from './domain.js';
import { Entity } from '../entity.js';
import { Product } from './product.js';

export class SupplyDomain extends Entity {
  protected static resourceName = 'supply_domains';
  protected static singularName = 'supplyDomain';
  protected static pluralName = 'supplyDomains';

  @SupplyDomain.property({type: Date})
  public archived?: Date | null;

  @SupplyDomain.property()
  public id?: number;

  @SupplyDomain.property()
  public needsDrafting?: boolean;

  @SupplyDomain.property()
  public product?: Product;

  @SupplyDomain.property({type: Product})
  public supplyProduct?: Product | null;

  @SupplyDomain.property()
  public domain?: Domain;
}
