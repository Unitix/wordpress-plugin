// eslint-disable-next-line no-unused-vars
import { RequestOptions } from './request.js';
// eslint-disable-next-line no-unused-vars
import { Merchi } from './merchi.js';
// eslint-disable-next-line no-unused-vars
import { NotificationSection } from './constants/notification_sections.js';
// eslint-disable-next-line no-unused-vars
import { NotificationType } from './constants/notification_types.js';

interface RelatedObj {
  id: number;
  type: string;
}

interface ToastOptions {
  entities: RelatedObj[];
  sections: NotificationSection[];
  notificationTypes?: Record<NotificationType, boolean>;
}

export const toastNotifications = (merchi: Merchi, options: ToastOptions) => {
  const resource = '/notifications-check-update/';
  const data = new FormData();
  const { entities, sections, notificationTypes } = options;
  data.set('entities', JSON.stringify(entities));
  data.set('sections', JSON.stringify(sections));
  data.set('notificationTypes', JSON.stringify(notificationTypes));
  const fetchOptions: RequestOptions = { method: 'POST', body: data };
  return merchi
    .authenticatedFetch(resource, fetchOptions)
    .then((data: any) =>
      data.notifications.map((n: any) => new merchi.Notification().fromJson(n))
    );
};
