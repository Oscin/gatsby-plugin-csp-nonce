/**
 * Implement Gatsby's SSR (Server Side Rendering) APIs in this file.
 *
 * See: https://www.gatsbyjs.com/docs/ssr-apis/
 */

const React = require("react");

/**
 * Called after every page Gatsby server renders while building HTML
 * so you can replace head components to be rendered in your html.js.
 * This is useful if you need to reorder scripts or styles added by other plugins.
 * @param pathname
 * @param getHeadComponents
 * @param replaceHeadComponents
 * @param getPreBodyComponents
 * @param getPostBodyComponents
 * @param userPluginOptions
 */
exports.onPreRenderHTML = (
    {
        pathname,
        getHeadComponents,
        replaceHeadComponents,
        getPreBodyComponents,
        replacePreBodyComponents,
        getPostBodyComponents,
        replacePostBodyComponents,
    },
    userPluginOptions
    ) => {

    const {
        disableOnDev = true,
        nonce = "DhcnhD3khTMePgXw",
    } = userPluginOptions;

    // early return if plugin is disabled on dev env
    if (process.env.NODE_ENV === "development" && disableOnDev) {
        return;
    }

    console.log(`Adding nonce '${nonce}' in file: '${pathname}'`);

    // update the components
    updateComponents( getHeadComponents(), "script", nonce, replaceHeadComponents )
    updateComponents( getPreBodyComponents(), "script", nonce, replacePreBodyComponents )
    updateComponents( getPostBodyComponents(), "script", nonce, replacePostBodyComponents )
    updateComponents( getHeadComponents(), "style", nonce, replaceHeadComponents )
    updateComponents( getPreBodyComponents(), "style", nonce, replacePreBodyComponents )
    updateComponents( getPostBodyComponents(), "style", nonce, replacePostBodyComponents )
}

/**
 * Update the components
 * @param array
 * @param type
 * @param nonce
 * @param replace
 */
function updateComponents( array, type, nonce, replace ) {

    // divide all components in two arrays: one with meets criteria and one which doesn't
    let [pass, remaining] = partitionBy( array, (element) => {
        //console.log(element)
        if ( isType(element, type) && isInline(element)  ) {
           return true;
        }
        return false;
    } );

    // we loop through all filtered components
    pass.map((component) => {

        // clone the component and add nonce
        const clonedComponent = React.cloneElement(
            component,
            { nonce: nonce }
        );

        //console.log(`Success: Added nonce '${nonce}' to component with key: '${component.key}'`);

        // add the cloned component to the array of the failed ones
        // together they will form an array without duplicates
        // if we would add the replaced components to the original array,
        // elements would exists twice in the HTML. e.g. <script>test 1</script> <script nonce="abc">test 1</script>
        remaining.push(clonedComponent);
    })

    // set the new array and pass to Gatsby
    replace(remaining);
}

/**
 * Divide the array in two seperate arrays based on criteria
 * https://stackoverflow.com/questions/11731072/dividing-an-array-by-filter-function
 * @param arr
 * @param predicate
 */
const partitionBy = (arr, predicate) =>
    arr.reduce(
        (acc, item, index, array) => (
            acc[+!predicate(item, index, array)].push(item), acc
        ),
        [[], []]
    );

/**
 * Determine if the component is of a certain type
 * @param element
 * @param type
 * @returns {boolean}
 */
let isType = (element, type) => element.type === type;

/**
 * Check if the component is inline or not
 * @param element
 * @returns {*|boolean}
 */
let isInline = (element) =>
    element.props.dangerouslySetInnerHTML &&
    element.props.dangerouslySetInnerHTML.__html.length > 0;