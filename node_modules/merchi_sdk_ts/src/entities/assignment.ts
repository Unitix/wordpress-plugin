import { Entity } from '../entity.js';
import { Quote } from './quote.js';
import { MerchiFile } from './file.js';
import { Job } from './job.js';
import { Notification } from './notification.js';
import { ProductionComment } from './production_comment.js';
import { Shipment } from './shipment.js';
import { SupplyDomain } from './supply_domain.js';
import { User } from './user.js';
import { RequestOptions } from '../request.js';

interface GenerateInvoiceProps {
  addToInvoice? : number;
}

export class Assignment extends Entity {
  protected static resourceName = 'assignments';
  protected static singularName = 'assignment';
  protected static pluralName = 'assignments';

  @Assignment.property({type: Date})
  public archived?: Date | null;

  @Assignment.property()
  public id?: number;

  @Assignment.property({type: Date})
  public managerAccepts?: Date | null;

  @Assignment.property({type: Date})
  public supplierRefused?: Date | null;

  @Assignment.property()
  public needsDrafting?: boolean;

  @Assignment.property()
  public needsShipping?: boolean;

  @Assignment.property()
  public productionDeadline?: Date;

  @Assignment.property()
  public assignmentDeadline?: Date;

  @Assignment.property({type: String})
  public notes?: string | null;

  @Assignment.property({type: 'Job'})
  public job?: Job | null;

  @Assignment.property({type: 'Job'})
  public supplyJob?: Job | null;

  @Assignment.property({type: User})
  public supplier?: User | null;

  @Assignment.property({type: Quote})
  public quote?: Quote | null;

  @Assignment.property()
  public quoteTotalCost?: number;

  @Assignment.property({arrayType: 'ProductionComment'})
  public comments?: ProductionComment[];

  @Assignment.property({type: Shipment})
  public shipment?: Shipment | null;

  @Assignment.property({type: SupplyDomain})
  public supplyDomain?: SupplyDomain | null;

  @Assignment.property({arrayType: 'Notification'})
  public notifications?: Notification[];

  @Assignment.property({arrayType: 'MerchiFile'})
  public productionFiles?: MerchiFile[];

  public generateInvoice = (props?: GenerateInvoiceProps) => {
    const resource = `/generate-invoice-for-assignment/${this.id}/`;
    const fetchOptions: RequestOptions = {method: 'POST'};
    fetchOptions.query = [];

    if (props && props.addToInvoice) {
      fetchOptions.query.push(['add_to_invoice', String(props.addToInvoice!)]);
    }

    return this.merchi.authenticatedFetch(resource, fetchOptions).
      then((data: any) => {
        const invoice = new this.merchi.Invoice();
        invoice.fromJson(data);
        return invoice;
      });
  };

}
