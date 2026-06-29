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


@Jun 29, 2026 - Comment Experience
    - We are fine tuning the comments experience. 
    - The comments that relate to a particular section need to be stacked together with the recent comment at the top. On click, expand to show the comments, when clicked outside -- collapse that stack. 
    - The design of the stack -- I still need the comments flushed to the background
    - If there's a stack of comments -- show a line beneath the comment with reduced length compared to the comment.
    - If there are more than 2 comments particular to that section, show two lines, with the second line smaller than the line before it. 
    - The comments should always start at the same level as the section title it is part of, if there are more comments associated with that section -- in the expanded mode -- do an internal scroll within that length of that area.(Importnat)
    - Remove the section tag indications inside the comment -- the new experience will implicitly do that. 
    - In the second grid column, each section title has a comment icon. We need an indication of how many comments we have associated with that section in that area
        - I am thinking -- by defualt we show the number of comments in brand-navy filled bg circle and a number next to the comment icon.
        - on hover we expand to show the cta, instead we show two CTAs, keep the add note as is, and the second cta is CTA to scroll the right pane  to the corresponding comment stack or comment section. 

@Jun 29, 2026 - Drag a contract UI
    - I am thinking of a AI chat text area with a length of 520px and height of 260px. 
    - When I drag and drop a contract, it sits as an attachment in that text area. 
    - I can add more contracts as attachments, 
    - Take me to the next page only when I click Process in the Text Area added now.
    - Retain the H1 and subtext and add the chat area below. 
    - The drop contract button will be subtle inside the chat area toward the lower bottom of the text area. 
    - Without any attachments, the process button should be disabled
        - With attachments, it should be enabled. 
    - Change the subtext to "You can drop multiple contracts as attachments to begin..."

@Jun 29, 2026, - Contract Processing page
    - I need like a Left and right navigator to the left of the Primary CTA
    - Use left arrow and right arrow icon. Show a (label between arrows that says in this format <number/number contracts>)
    - I can review multiple contracts ready for review by using the left and right button. 
    - On clicking right, show me the next contract that is ready for processig or ready for sening for approval. 
    - This is basically an internal way to navigate between the contraccy list that is shown in the popover of the first page. 
    - Add some mock data to show a demo of this feature. 
    - In the contract popover, when I click on a contract item, it should take me to the Contract Processing page -- that is the expectation -- when I click the new contract button from that page, you will take me back to the drop a contract page. 