import { Company } from './company.js';
import { Entity } from '../entity.js';
import { User } from './user.js';

export class EmailAddress extends Entity {
  protected static resourceName = 'email_addresses';
  protected static singularName = 'emailAddress';
  protected static pluralName = 'emailAddresses';

  @EmailAddress.property({type: Date})
  public archived?: Date | null;

  @EmailAddress.property()
  public id?: number;

  @EmailAddress.property()
  public emailAddress?: string;

  @EmailAddress.property({arrayType: 'User'})
  public users?: User[];

  @EmailAddress.property({arrayType: 'Company'})
  public companies?: Company[];
}
