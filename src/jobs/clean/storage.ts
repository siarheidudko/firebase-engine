import { App } from "../../utils/FirebaseAdmin";
import { Settings } from "../../utils/initialization";
import { JobOneServiceTemplate } from "../../utils/template";
import { Logger } from "../../utils/Logger";
import { Storage, Bucket } from "@google-cloud/storage";

export class JobCleanStorage extends JobOneServiceTemplate {
  /**
   * @param settings - settings object
   * @param admin - firebase app
   * @param store - google cloud storage app
   */
  constructor(settings: Settings, admin: App, store: Storage) {
    super(settings, admin, store);
  }
  /**
   * job runner
   */
  public async run() {
    let buckets: Bucket[];
    if (this.settings.buckets.length > 0) {
      buckets = this.settings.buckets.map((name) => this.store.bucket(name));
    } else {
      [buckets] = await this.store.getBuckets();
      if (buckets.length === 0) {
        buckets = [
          this.store.bucket(
            this.settings.serviceAccount.project_id + ".appspot.com"
          ),
        ];
      }
    }
    this.startTimestamp = Date.now();
    for (const bucket of buckets)
      if (
        this.settings.buckets.length === 0 ||
        this.settings.buckets.indexOf(bucket.name) !== -1
      ) {
        await bucket.deleteFiles();
        if (bucket.name.indexOf(this.admin.options.storageBucket as string))
          await bucket.delete();
      }
    await new Promise((res) => {
      setTimeout(res, 1);
    });
    Logger.log(" -- Storage Cleaned files in " + this.getWorkTime() + ".");
    Logger.log(" - Storage Clean Complete!");
    return;
  }
}
