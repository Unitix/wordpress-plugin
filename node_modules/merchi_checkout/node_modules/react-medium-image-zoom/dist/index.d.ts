import React from 'react';

declare const enum ModalState {
    LOADED = "LOADED",
    LOADING = "LOADING",
    UNLOADED = "UNLOADED",
    UNLOADING = "UNLOADING"
}
interface ControlledProps {
    a11yNameButtonUnzoom?: string;
    a11yNameButtonZoom?: string;
    canSwipeToUnzoom?: boolean;
    children: React.ReactNode;
    classDialog?: string;
    IconUnzoom?: React.ElementType;
    IconZoom?: React.ElementType;
    isZoomed: boolean;
    onZoomChange?: (value: boolean) => void;
    swipeToUnzoomThreshold?: number;
    wrapElement?: 'div' | 'span';
    ZoomContent?: (data: {
        img: React.ReactElement | null;
        buttonUnzoom: React.ReactElement<HTMLButtonElement>;
        modalState: ModalState;
        onUnzoom: () => void;
    }) => React.ReactElement;
    zoomImg?: React.ImgHTMLAttributes<HTMLImageElement>;
    zoomMargin?: number;
}
declare function Controlled(props: ControlledProps): React.JSX.Element;

type UncontrolledProps = Omit<ControlledProps, 'isZoomed' | 'onZoomChange'>;
declare function Uncontrolled(props: UncontrolledProps): React.JSX.Element;

export { Controlled, type ControlledProps, type UncontrolledProps, Uncontrolled as default };
