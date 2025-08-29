import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    collapsed: false,
    autoCollapsed: false
};

const themeSlice = createSlice({
    name: 'theme',
    initialState,
    reducers: {
        toggleSidebar: (state) => {
            
            state.collapsed = !state.collapsed;
        },
        collapseSidebar: (state, action) => {
            state.collapsed = action.payload;
        },
        toggleAutoCollapse: (state, action) => {
            state.autoCollapsed = action.payload;
        }
    }
});

export const { toggleSidebar, collapseSidebar, toggleAutoCollapse } = themeSlice.actions;
export default themeSlice.reducer;
