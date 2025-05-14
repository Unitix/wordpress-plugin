import { Entity } from '../entity.js';
import { Assignment } from './assignment.js';
import { Job } from './job.js';

export class ShipmentItemFulfillment extends Entity {
  protected static resourceName = 'shipment_item_fulfillments';
  protected static singularName = 'shipmentItemFulfillment';
  protected static pluralName = 'shipmentItemFulfillments';

  @ShipmentItemFulfillment.property({type: 'Assignment'})
  public assignment?: Assignment;

  @ShipmentItemFulfillment.property({type: 'Job'})
  public job?: Job;
}
