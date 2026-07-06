This file is used to give Context to build complex features. Only use this when explicity tagged in the chat. Otherwise, no need to even read this.

<Ignore-This>
    Contract Processing
            - Products and pricing finessing is required - Figma options>>
    Sales Order Processed
            - Should we approach the sales order details as a proper card like the Invoice 
            - Task and record should have different flavours
    Copilot and Nav
            - How will we differentiat side bar agent with agentic workflows
            - Side menu -- we need to keep it lean and purposeful. Remove all configurations related stuff and handle it separately. 


@July 2, 2026 - Feedback

    Based on the feedback items above, the feature explanaions are like the following:

        Workbench Page
            - Task ID, Task Name, and Task Type -- I want to simplify that. Task Type and Task Name -- can be a single column called Task Type in the format: <Task Name: Task Type>. After that Bring Customer Name as the next column. Then the Task ID. 
            - In the subject column -- there should be some indication of effective start date like starts in 5 days to show urgency. Remove the PDF names in the subject and stick to valuable context about the ingestion. 
            - Teh status column needs some work as well --  In Review status should be in green tone. Ready for review in grey tone like the Task Name tag design in the same table. Pending approval stays as it is. Introduce a new status called "Blocked" that should be in the red tone. 
        
        Contract Processing Page
            - Switch position of the chevron up down icon and the expand feature in the secondary nav. For the expand feature use a combination of icons to denote the functionality -- use maximise icon to toggle to full screen mode where panels collapse. and focus mode to swtich back the panels. 
            - The task switcher in drop down needs to have things like the ones in the workbench columns to be able to make a choise -- Task ID should be of least priority (that can be subtle in grey like the customer name now -- bring back other columns like task type, and status -- The popover can be wider with these information having a sort of list view. 
            - On the Contract Ingestion page -- wherever dates are used -- we need relative date next to in bracket or something -- that is a useful feature. )
            -The in-page menu -- the selected state bg needs to hug the content rather than extend fully. 
            - Add Field button in the Account section and Add item button in the Products and pricing section -- both of these should feel part of the list/table. Now it's a separate button what if we treat as a line item itself which means when hovering the hover state (blue tones) should extend fully to the column. and the button will be tightly sitting as part of the line item. 
            - In Products and pricing table -- for the ramp denotions (the period information) -- this is an important change -- move the collapse icon (keep it in blue) to the left of the period label - with negative margin like how we have the other icon in the table on the left. The period label should replace the Item label in the table -- that way we don't need another row to denote period -- it can be part of the table -- the collapsed state can stay as is -- expand to see the period information in the place we have Item label. In the collapsed state -- the gap between different periods are high -- tighten them by reducing 50% gap. 
            - Invoicce Preview -- just show one preview (first invocie preview ) -- change the label to First Invocie preview. 
            - The preview icon inside the billing schedule details -- on click can open the invoice preview in a new browser window. like how we open contract pdfs. 
        
        Sales Order Details Page (After Creating Sales Order)
            - The secondary nav icon repositioning of expand and and chevron up-down feature should be the same as the Contract Processing page mentioned above. 
            - Treat the comments as a separate section below the Past Invoices. Maintain the width constraints we have for Past Invoices similarly to the comments. Where we have the number of comments in the previous sections (you can remove all those except for this comments section -- where we need number of comments shown here) -- in the other sections we don't need that denotion since we are cumulatively moving all comments down here. 
            - This page also needs a note dropped by the AI like in the Contract Procesing page -- the first section. This section in this page will house important information in verbose like Created on, starts on, how many ramps, ramp level amounts, first invoice of so and so amount sent -- things like that. This is critical to denote that the Contract has been processed and this is the summary. 
            - We need another section below the comments section titled Activity where in a similar fashion we denote the activity happened so far, from quote creation, quote approved, contract signed, contract processed, customer created, sales order created, first invoice generated, and first invoice sent. Keep this simple and give links to traverse to these objects if available using the IDs as part of each activity. This is a timeline based activity and I'd like to draw on a similar UI principles from the Billing Schedule section in the Contract processing page. 
            - The CTAs in the Sales Order Details Secondary nav -- needs to be more subtle -- We need CTAs that we used before like Add Field button in the Account section of the contract ingestion page -- change the CTAs here to that style -- subtle and lightweight, and show up to two ctas and the rest can sit inside the more button. The more button should have similar styling as well. 
            - In the past invoices section -- hyperlink the invoive ids like how we did source quote in the Summary section of this page. 
            - Add 260px free space below the last item in this page. As a standard practice -- do this for contract ingestion page as well. 



