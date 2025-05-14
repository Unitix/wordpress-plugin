import * as React from 'react';
import type * as Stitches from '@stitches/react';
import { Line, SpanText } from './divider.styles';
interface DividerProps extends Stitches.ComponentProps<typeof Line> {
    spanProps?: Omit<Stitches.ComponentProps<typeof SpanText>, 'children'>;
}
declare const Divider: ({ children, spanProps, ...props }: DividerProps) => React.ReactElement;
export default Divider;
export type { DividerProps };
//# sourceMappingURL=divider.d.ts.map