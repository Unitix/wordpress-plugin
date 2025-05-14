import { Domain } from './domain.js';
import { Product } from './product.js';
import { Entity } from '../entity.js';

export class SeoDomainPage extends Entity {
  protected static resourceName = 'seo_domain_pages';
  protected static singularName = 'seoDomainPage';
  protected static pluralName = 'seoDomainPages';

  @SeoDomainPage.property({type: Date})
  public archived?: Date | null;

  @SeoDomainPage.property()
  public id?: number;

  @SeoDomainPage.property()
  public domain?: Domain;

  @SeoDomainPage.property()
  public product?: Product;

  @SeoDomainPage.property()
  public metaDescription?: string;

  @SeoDomainPage.property()
  public metaRobots?: string;

  @SeoDomainPage.property()
  public metaTitle?: string;

  @SeoDomainPage.property()
  public pageKey?: string;
}
