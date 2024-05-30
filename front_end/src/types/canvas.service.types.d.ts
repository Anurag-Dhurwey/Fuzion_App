export interface Visibility {
    layer_panel: boolean;
    property_panel: boolean;
    tool_panel: boolean;
    setting_panel: boolean;
    menu_panel: boolean;
    export_panel: boolean;
    frame_selection_panel: boolean;
}

export interface Layout{
    visibility:Visibility
}