import { searchTool } from "../config/tavily.js"

export const searchAgent=async (state) => {
    // console.log(state,"HI State")
    try {
        const results= await searchTool.invoke({
            query:state.prompt
    });
    return {
        ...state,
        searchResults:results,
        images:results.images
    }
    } catch (error) {
        return {
            ...state,
            searchResults:[],
            images:[]
        }
        
    }
}