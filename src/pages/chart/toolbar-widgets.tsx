import { memo } from 'react';
import {
    ChartType,
    DrawTools,
    Share,
    StudyLegend,
    Timeperiod,
    ToolbarWidget,
    Views,
} from '@deriv/deriv-charts';

type TToolbarWidgetsProps = {
    updateChartType: (chart_type: string) => void;
    updateGranularity: (updateGranularity: number) => void;
    position?: string | null;
    isDesktop?: boolean;
};

const ToolbarWidgets = ({ updateChartType, updateGranularity, position, isDesktop }: TToolbarWidgetsProps) => {
    return (
        <ToolbarWidget position={position}>
            <div className="chart-mode">
                <ChartType
                    portalNodeId="modal_root"
                    onChartType={updateChartType}
                />
                <Timeperiod
                    portalNodeId="modal_root"
                    onGranularity={updateGranularity}
                />
            </div>
            {isDesktop && (
                <>
                    <StudyLegend portalNodeId='modal_root' searchInputClassName='data-hj-whitelist' />
                    <Views
                        portalNodeId='modal_root'
                        onChartType={updateChartType}
                        onGranularity={updateGranularity}
                        searchInputClassName='data-hj-whitelist'
                    />
                    <DrawTools portalNodeId='modal_root' />
                    <Share portalNodeId='modal_root' />
                </>
            )}
        </ToolbarWidget>
    );
};

export default memo(ToolbarWidgets);
