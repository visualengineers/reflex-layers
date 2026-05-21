import { Observable } from "rxjs";
import { DepthInformation } from "src/shared/model/depth-information";
import { TouchPoint } from "src/shared/model/touch-point";

export abstract class LayerLogicServiceBase {
    public abstract getLayerChange(): Observable<Number>;
    public abstract getDeepestPoint(): Observable<TouchPoint[]>;
    public abstract getDepthInformation(): Observable<DepthInformation[]>;
    public abstract getBottomReachedTransition(): Observable<boolean>;

}