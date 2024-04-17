import { trackBlobscriptions } from '@/indexing.ts';
import pluginBlob20 from './plugins/blob20';
import pluginBlobCreation from './plugins/blobs-creation';

trackBlobscriptions(async (payload) => {
  payload = await pluginBlobCreation(payload);
  payload = await pluginBlob20(payload);

  console.log('payload:', payload);
});
