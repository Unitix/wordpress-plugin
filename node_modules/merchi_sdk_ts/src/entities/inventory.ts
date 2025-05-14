import { Address } from './address.js';
import { Entity } from '../entity.js';
import { InventoryGroup } from './inventory_group.js';
import { InventoryUnitVariation } from './inventory_unit_variation.js';
import { Job } from './job.js';
import { Product } from './product.js';
import { VariationsGroup } from './variations_group.js';
import { VariationFieldsOption } from './variation_fields_option.js';
import { some } from 'lodash';

export class Inventory extends Entity {
  protected static resourceName = 'inventories';
  protected static singularName = 'inventory';
  protected static pluralName = 'inventories';

  @Inventory.property({type: Date})
  public archived?: Date | null;

  @Inventory.property()
  public id?: number;

  @Inventory.property()
  public quantity?: number;

  @Inventory.property()
  public name?: string;

  @Inventory.property()
  public notes?: string;

  @Inventory.property()
  public isOrphan?: boolean;

  @Inventory.property({arrayType: 'Product'})
  public products?: Product[];

  @Inventory.property({arrayType: 'InventoryGroup'})
  public inventoryGroups?: InventoryGroup[];

  @Inventory.property({type: Address})
  public address?: Address | null;

  @Inventory.property({arrayType: 'VariationsGroup'})
  public variationsGroups?: VariationsGroup[];

  @Inventory.property({arrayType: 'Job'})
  public jobs?: Job[];

  @Inventory.property({arrayType: 'InventoryUnitVariation'})
  public inventoryUnitVariations?: InventoryUnitVariation[];

  public isVariationFieldOptionSelected = (option: VariationFieldsOption) => {
    if (this.inventoryUnitVariations === undefined) {
      throw new Error(
        'inventoryUnitVariations is undefined, did you forget to embed it?');
    }
    return some(this.inventoryUnitVariations.map(
      (v: InventoryUnitVariation) => v.optionId() === option.id));
  };
}
