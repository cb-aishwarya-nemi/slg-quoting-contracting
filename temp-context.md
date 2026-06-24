This file is used to give Context to build complex features. Only use this when explicity tagged in the chat. Otherwise, no need to even read this.

Feature:
    Building out a lean headless version of the contract ingestion. 

Design and Visuals: 
    - Use only the existing colors, components, styling, and visual philosophy. We are just reusing the system as is to build out a leaner, MVP of V1.0 which we can schedule for a quicker launch. Any design decisions, always confirm, ask questions before taking calls on your own. 
    - Only difference is we need a theme switcher at the top to  flip dark and light mode. 
    - In dark mode, I expect the UI to just inverse as is, in terms of colors. CTAs and colors can remain the same. 
    - If blues are a little too dark for dark theme, use a lighter tone. 


How to:
    - We have a usecase switcher at the bottom. We will use that as the control for navigating to this version. Introduce a high level swticher called Versions. This will be "V0.1 Contract Ingestion". Move everything we have now into a version called "V1.0 SLG prototype".
    - In V0.1 -- let's do the following. Remove the left nav - Just retain the logo at the top with the site switcher. On the right, remove the help icon, and expand the profile avatar into a wider unit showing the name of the user. 
    - Add a new icon below the logo at the place of the home icon -- this is the icon that represents lists. 
    - This icon on hover opens the same hover card we have now with the previous list of contracts updated. The list item is with Contact Name, and some subject line to show a summary of the contract, keep it in 2 lines, anything more we can do ellipses and hide them
    - The hover card can be taller with the same gap it has at the top adopted to the bottom. 
    - This hover card will only show up if there are more than one contracts. 
    - Above this icon -- we have new contract icon which will be selected by default when there are no contracts, and the list contract menu will be hidden at that point. 
    - 
    - For the New Contract button, on click -- the page will show the following -- empty page with Use the Drop contracts modal in the same styling of the pill we have and position it in the center
        - I use it to open the finder on click. 
        - If I drag and drop the contract -- use the AI gradient tone we have to animate the drop contract box with a fluid animation that loops. 
        - Once dropped -- show a sleek progress bar of what we have now -- and the contract processing page we have now as is -- is what I see. 
        - Which means -- the top Customer Name will now be in the place of "Contract Processing.." label. 
        - The top bar with the workflow tabs will not be shown anymore. 
        - Since this is the lean version which has only Contract Ingestion flow. 
        - remove the status button.
        - Retain the comments, in-page nav.
        - Introduce an expand button - compact and tiny close to the Contract Summary section.
            - On click the comment and in-page nav units are hidden.
            - Have an inverted button to bring back the in-page nav and comments. 

Nuances:
    - Ask me any questions you have. 
    - Confirm before taking your own choice. 
    - Sleek, Modern, and Simple are some of the key words for this.
    - Judicious use of colors and intentional. Else -- keep it very MS-DOS-y style as we have now. 
