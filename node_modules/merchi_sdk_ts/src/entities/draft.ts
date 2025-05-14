import { DraftComment } from './draft_comment.js';
import { Entity } from '../entity.js';
import { MerchiFile } from './file.js';
import { Job } from './job.js';
import { Notification } from './notification.js';
import { User } from './user.js';
import { DraftTemplate } from './draft_template.js';

export class Draft extends Entity {
  protected static resourceName = 'drafts';
  protected static singularName = 'draft';
  protected static pluralName = 'drafts';

  @Draft.property({type: Date})
  public archived?: Date | null;

  @Draft.property()
  public id?: number;

  @Draft.property({type: Date})
  public date?: Date | null;

  @Draft.property({type: Date})
  public accepted?: Date | null;

  @Draft.property({type: Date})
  public resendDate?: Date | null;

  @Draft.property()
  public viewed?: boolean;

  @Draft.property()
  public sendSms?: boolean;

  @Draft.property()
  public sendEmail?: boolean;

  @Draft.property({arrayType: 'DraftComment'})
  public comments?: DraftComment[];

  @Draft.property({arrayType: 'DraftTemplate'})
  public draftTemplates?: DraftTemplate[];

  @Draft.property()
  public commentsCount?: number;

  @Draft.property()
  public changesRequested?: boolean;

  @Draft.property()
  public designer?: User;

  @Draft.property({arrayType: 'MerchiFile'})
  public images?: MerchiFile[];

  @Draft.property({arrayType: 'Notification'})
  public notification?: Notification[];

  @Draft.property()
  public job?: Job;

  @Draft.property()
  public sharedWithJob?: Job;

  public commentsYoungestToEldest = () => {
    if (this.comments === undefined) {
      throw 'comments is undefined. did you forget to embed it?';
    }
    return this.comments.sort((a, b) => {
      if (a.id === undefined || b.id === undefined) {
        throw 'comment id is undefined. did you forget to embed it?';
      }
      return a.id - b.id;
    });
  };
}
