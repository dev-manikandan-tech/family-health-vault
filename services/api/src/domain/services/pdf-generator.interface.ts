import { TimelineEvent } from '../entities/timeline-event.entity';

export interface IPdfGenerator {
  generateTimelinePdf(
    profileName: string,
    events: TimelineEvent[],
  ): Promise<Buffer>;
}
