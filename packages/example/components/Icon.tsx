import React, { FunctionComponent } from 'react';

type RawGlyph = [0 | 1, string, string, number, number];
interface IconProps {
  width?: number;
  height?: number;
  glyph: RawGlyph;
}

const Icon: FunctionComponent<IconProps> = ({ glyph, width, height }) => {
  const [isInline, urlOrData, hash, widthRatio, heightRatio] = glyph;;

  const calculatedWidth = width || (height || 90) * heightRatio;
  const calculatedHeight = height || calculatedWidth * widthRatio;

  if (isInline) {
    return <i dangerouslySetInnerHTML={{__html: urlOrData}}></i>
  }
  return (
    <img width={calculatedWidth} height={calculatedHeight} src={`${urlOrData}#${hash}`} />
  )
  // return (
  //   <svg width={calculatedWidth} height={calculatedHeight}>
  //     <use xlinkHref={`${urlOrData}#${hash}`} />
  //   </svg>
  // );
};

export default Icon;
