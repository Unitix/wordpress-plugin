import { Entity } from '../entity.js';
import { MerchiFile } from './file.js';

export class Backup extends Entity {
  protected static resourceName = 'backups';
  protected static singularName = 'backup';
  protected static pluralName = 'backups';

  @Backup.property()
  public id?: number;

  @Backup.property()
  public file?: MerchiFile;
}
