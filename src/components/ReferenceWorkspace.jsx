import React from 'react';
import SplitPane from './SplitPane';
import ReferenceDisplay from './ReferenceDisplay';
import TypingArea from './TypingArea';

const ReferenceWorkspace = ({
  referenceText,
  typingText,
  onComplete,
  onProgressChange,
  showIPA = false,
  dictationMode = false,
  theme = 'normal',
  splitRatio = 0.5,
  onSplitRatioChange,
  height
}) => {
  const containerStyle = height ? { height: `${height}px` } : {};

  return (
    <div className="w-full" style={containerStyle}>
      <SplitPane
        ratio={splitRatio}
        onChangeRatio={onSplitRatioChange}
        theme={theme}
        left={
          <ReferenceDisplay 
            text={referenceText}
            theme={theme}
          />
        }
        right={
          <TypingArea
            text={typingText}
            onComplete={onComplete}
            onProgressChange={onProgressChange}
            showIPA={showIPA}
            dictationMode={dictationMode}
            theme={theme}
            inSplitView={true}
          />
        }
      />
    </div>
  );
};

export default ReferenceWorkspace;