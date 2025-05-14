import { CartItem } from './cart_item.js';
import { Entity } from '../entity.js';
import { Job } from './job.js';
import { Variation } from './variation.js';
import { MatchingInventory } from './matching_inventory.js';

export class VariationsGroup extends Entity {
  protected static resourceName = 'variations_groups';
  protected static singularName = 'variationsGroup';
  protected static pluralName = 'variationsGroups';

  @VariationsGroup.property({type: Date})
  public archived?: Date | null;

  @VariationsGroup.property()
  public id?: number;

  @VariationsGroup.property()
  public quantity?: number;

  @VariationsGroup.property({type: Number})
  public groupCost?: number | null;

  @VariationsGroup.property({type: Job})
  public job?: Job | null;

  @VariationsGroup.property({type: CartItem})
  public cartItem?: CartItem | null;

  @VariationsGroup.property({type: MatchingInventory})
  public matchingInventory?: MatchingInventory | null;

  @VariationsGroup.property({arrayType: 'Variation'})
  public variations?: Variation[];

  @VariationsGroup.property({embeddedByDefault: false})
  public inventoryCount?: number;

  @VariationsGroup.property({embeddedByDefault: false})
  public inventorySufficient?: boolean;
}
