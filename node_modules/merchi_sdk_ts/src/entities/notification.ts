import { Assignment } from './assignment.js';
import { Domain } from './domain.js';
import { Draft } from './draft.js';
import { DraftComment } from './draft_comment.js';
import { Entity } from '../entity.js';
import { MerchiFile } from './file.js';
import { Invoice } from './invoice.js';
import { Job } from './job.js';
import { JobComment } from './job_comment.js';
import { ProductionComment } from './production_comment.js';
import { ShortUrl } from './short_url.js';
import { User } from './user.js';

export class Notification extends Entity {
  protected static resourceName = 'notifications';
  protected static singularName = 'notification';
  protected static pluralName = 'notifications';

  @Notification.property({type: Date})
  public archived?: Date | null;

  @Notification.property()
  public id?: number;

  @Notification.property()
  public notificationType?: number;

  @Notification.property()
  public date?: Date;

  @Notification.property()
  public seen?: boolean;

  @Notification.property()
  public sendEmail?: boolean;

  @Notification.property()
  public sendSms?: boolean;

  @Notification.property()
  public urgency?: number;

  @Notification.property({type: String})
  public description?: string | null;

  @Notification.property({type: String})
  public subject?: string | null;

  @Notification.property()
  public message?: string;

  @Notification.property()
  public htmlMessage?: string;

  @Notification.property({type: String})
  public link?: string | null;

  @Notification.property()
  public section?: number;

  @Notification.property({type: ShortUrl})
  public shortUrl?: ShortUrl | null;

  @Notification.property()
  public recipient?: User;

  @Notification.property({type: User})
  public sender?: User | null;

  @Notification.property({type: Job})
  public relatedJob?: Job | null;

  @Notification.property({type: Draft})
  public relatedDraft?: Draft | null;

  @Notification.property({type: Assignment})
  public relatedAssignment?: Assignment | null;

  @Notification.property({type: Invoice})
  public relatedInvoice?: Invoice | null;

  @Notification.property({type: JobComment})
  public relatedJobComment?: JobComment | null;

  @Notification.property({type: DraftComment})
  public relatedDraftComment?: DraftComment | null;

  @Notification.property({type: ProductionComment})
  public relatedProductionComment?: ProductionComment | null;

  @Notification.property()
  public domain?: Domain;

  @Notification.property({type: MerchiFile})
  public avatar?: MerchiFile | null;

  @Notification.property({type: MerchiFile})
  public attachment?: MerchiFile | null;
}
