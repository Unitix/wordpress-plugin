import { Bank } from './bank.js';
import { Company } from './company.js';
import { Entity } from '../entity.js';
import { Inventory } from './inventory.js';
import { Invoice } from './invoice.js';
import { Job } from './job.js';
import { Shipment } from './shipment.js';
import { User } from './user.js';

export class Address extends Entity {
  protected static resourceName = 'addresses';
  protected static singularName = 'address';
  protected static pluralName = 'addresses';

  @Address.property({type: Date})
  public archived?: Date | null;

  @Address.property()
  public id?: number;

  @Address.property({type: String})
  public lineOne?: string | null;

  @Address.property({type: String})
  public lineTwo?: string | null;

  @Address.property({type: String})
  public city?: string | null;

  @Address.property({type: String})
  public state?: string | null;

  @Address.property({type: String})
  public country?: string | null;

  @Address.property({type: String})
  public postcode?: string | null;

  @Address.property({arrayType: 'Shipment'})
  public shipmentAsSenderAddress?: Shipment[];

  @Address.property({arrayType: 'Shipment'})
  public shipmentsAsReceiverAddress?: Shipment[];

  @Address.property({arrayType: 'Bank'})
  public banks?: Bank[];

  @Address.property({arrayType: 'User'})
  public users?: User[];

  @Address.property({arrayType: 'Inventory'})
  public inventories?: Inventory[];

  @Address.property({arrayType: 'Job'})
  public jobs?: Job[];

  @Address.property({arrayType: 'Job'})
  public productedJobs?: Job[];

  @Address.property({arrayType: 'Invoice'})
  public shippingTo?: Invoice[];

  @Address.property({arrayType: 'Company'})
  public companies?: Company[];
}
