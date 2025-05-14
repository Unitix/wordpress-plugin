import { Entity } from '../entity.js';
import { MerchiFile } from './file.js';
import { Job } from './job.js';
import { Notification } from './notification.js';
import { User } from './user.js';

export class JobComment extends Entity {
  protected static resourceName = 'job_comments';
  protected static singularName = 'jobComment';
  protected static pluralName = 'jobComments';

  @JobComment.property({type: Date})
  public archived?: Date | null;

  @JobComment.property()
  public id?: number;

  @JobComment.property({type: Date})
  public date?: Date | null;

  @JobComment.property()
  public text?: string;

  @JobComment.property()
  public sendSms?: boolean;

  @JobComment.property()
  public sendEmail?: boolean;

  @JobComment.property()
  public openToClient?: boolean;

  @JobComment.property()
  public urgency?: number;

  @JobComment.property({arrayType: "MerchiFile"})
  public files?: MerchiFile[];

  @JobComment.property({arrayType: 'User'})
  public forwards?: User[];

  @JobComment.property({arrayType: 'Notification'})
  public notifications?: Notification[];

  @JobComment.property()
  public job?: Job;

  @JobComment.property()
  public user?: User;
}
