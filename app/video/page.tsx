import VideoPlayer from '@/components/VideoPlayer';
import WatchLaterPanel from '@/components/WatchLaterPanel';

export const metadata = {
  title: 'Oidarwave - Video',
  description: 'Oidarwave Video-Streaming mit live TV-Sendern.',
};

export default function VideoPage() {
  return (
    <>
      <VideoPlayer />
      <WatchLaterPanel />
    </>
  );
}
