import { Draft } from './draft.js';
import { Entity } from '../entity.js';
import { MerchiFile } from './file.js';
import { Job } from './job.js';
import { Notification } from './notification.js';
import { User } from './user.js';

export class DraftComment extends Entity {
  protected static resourceName = 'draft_comments';
  protected static singularName = 'draftComment';
  protected static pluralName = 'draftComments';

  @DraftComment.property({type: Date})
  public archived?: Date | null;

  @DraftComment.property()
  public id?: number;

  @DraftComment.property({type: Date})
  public date?: Date | null;

  @DraftComment.property()
  public urgency?: number;

  @DraftComment.property()
  public text?: string;

  @DraftComment.property()
  public changeRequest?: boolean;

  @DraftComment.property()
  public sendSms?: boolean;

  @DraftComment.property()
  public sendEmail?: boolean;

  @DraftComment.property()
  public user?: User;

  @DraftComment.property({arrayType: "MerchiFile"})
  public files?: MerchiFile[];

  @DraftComment.property({arrayType: 'User'})
  public forwards?: User[];

  @DraftComment.property({arrayType: 'Notification'})
  public notifications?: Notification[];

  @DraftComment.property({type: Draft})
  public draft?: Draft | null;

  @DraftComment.property({type: Job})
  public job?: Job | null;
}
