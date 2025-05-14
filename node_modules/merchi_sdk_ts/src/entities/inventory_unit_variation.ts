import { Entity } from '../entity.js';
import { Inventory } from './inventory.js';
import { VariationFieldsOption } from './variation_fields_option.js';

export class InventoryUnitVariation extends Entity {
  protected static resourceName = 'inventory_unit_variations';
  protected static singularName = 'inventoryUnitVariation';
  protected static pluralName = 'inventoryUnitVariations';

  @InventoryUnitVariation.property({type: Date})
  public archived?: Date | null;

  @InventoryUnitVariation.property()
  public id?: number;

  @InventoryUnitVariation.property()
  public inventory?: Inventory;

  @InventoryUnitVariation.property()
  public variationFieldsOption?: VariationFieldsOption;

  public optionId = () => {
    if (this.variationFieldsOption === undefined) {
      throw new Error(
        'variationFieldsOption is undefined, did you forget to embed it?');
    }
    return this.variationFieldsOption.id;
  };
}
