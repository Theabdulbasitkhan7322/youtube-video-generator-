import React from 'react';
import { Composition } from 'remotion';
import { BeyondObviousComposition } from './BeyondObviousComposition';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BeyondObvious"
        component={BeyondObviousComposition}
        durationInFrames={560}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
