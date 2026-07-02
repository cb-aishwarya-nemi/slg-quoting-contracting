This file is used to give Context to build complex features. Only use this when explicity tagged in the chat. Otherwise, no need to even read this.


@July 2, 2026 - Handover Fixes needed for Contract Ingestion V1.0
    - The workbench page - The table that is there in the My tasks page -- the table is very contract ingestion specific -- I want that to be generic that the table can be used for a varitety of tasks ( I am thinking Task ID, Task Type (Contract Ingestion), Task Name (New deal, Early Renewal...), Cutomer, Subject (a brief description of the task - summary), Status, Created on)
    - Remove the Contract Queue tab in the Workbench page and just keep My tasks, and  Approvals. When clicking Approvals, the header that shows My tasks should change to Approvals.
    - When I drop a contract -- after uploading, take the user directly to the Custoemr Linking page instead of adding a workbench item and then asking the4 user to click it. 
    - In the Mytasks page -- remove the ellipses icon in each row just retain the arrow on hover state. 

@July 2, 2026 - Customer Linking Page: 
    - In the title section, In the same font -- rename the label to "Contract processing.." and add a subtitle underneath it saying, Link customer to this contract and and  get started.
    - In No match found usecase, add some empty space of 120px below the Create New Customer fields to avoid the drop a contract and fields getting cut. 

@July 2, 2026 - Contract Processing page
    - The in-page nav in the contract processing page - Right now it's flushed and on page
        - I am looking at an upgraded in-page nav -- with lines for each navigation menu in brand-navy 2px thickenss and 24px width and gap between them is around 12px.. The Scroll and selected  action  is that the line scales big to the right up to 32px in nice animaiton. The selected state or active state is the menu item is in blue-700 and 32px width.
        - For the PDF links we have in the page, we don't need a symbolising in the compact view. 
        - On hover on these lines -- the menu + links we have now is shown inside a popover which will still have the same features we have now. 
        - This change will make the content area to the centre grow wider -- let it grow but restrict the max-wdith for Billing Schedule content area alone and Invoice Preview content area alone to 780px width like the summary section. (this should not apply to the title unit of these sections only the content units.)
    - Change the label of Send for approval to "Create Sale Order"
    - Remove the back button in the secondary nav. 

@July 2, 2026 - Tabs reorganisation
    - We need to reorganise the What we should in Contracts tab when a workbench item is clicked to the Tasks tab. Just move the entirety from the secondary nav  to that tab. 
    - Rename the tab label Contracts to "Sales Order"
    - When I cick Create Sales Order button -- you will take me to the Sales Order tab with the contract that has just been processed as the content under details page. 
    
@July 2, 2026 - Sales Order Details
    - This is going to be a page with similar approach like Invoice Details
    - I want the following information covered in the central area -- Comments feature should still be section-wise. Use design philosophy and styles as the Contract processing page. 
    - Attached screenshot shows the information I want to showcase but the design and stylign and layouts should be from what we have within the repo and not the screenshot.
    - Sales Order Id (Secdondary nav title in brand-navy + Chevon-up-down icon in blue-700), Subtitle on the left in the secondary nav will house Created on date, ramp details, starts from date. 
    - On the right of the secondary nav - like in the Invoice Details page - Amend Order will be the primary cta followed by the Ellipses icon. 
    - The left in-page nav will be like how are updating the Contract Processing page with the lines and on hover showing the menu items in the popover we want it like that (!!IMportant)
    - Everything in this page is read-only -- The content area has the following sections, Summary ([Source quote label + value], Total contract value, Avg annual value, Contract term, Renewal action), Committed Entitlements, Products and pricing (Needs to be very close to the Contract Processing page but not as a data table but as a read-only list view with tight compact views no need for vertical seperators, only horizontal seperators needed), Upcoming billing schedule, Past invoices (lines view with some status and invoice amount all in singular lines -- no clubbbing of lines)
    - Each section will have comment feature like how we have in Contract Processing page as is.

@July 2, 2026 - Contract Processing Page Nuances
    - The label in the seconday nav should be <Task ID> that will come for the workbench task
    - Remove the label 3 of 4 sections ready in the Secondary nav. 
    - Add a new label to the top of the Summary section with a magic icon and label "Summary" in AI-gradient color tone to the icon and the label.
 
 @July 2, 2026 - Global edits
    - In the customer 360 page -- in the tab bar area -- the left side -- the Breadcrumb above the customer name should just be chevron-back button with lael "Back to customers"
    - Remove the close button before the customer name. 
    - In the Secondary nav of all details page, and Contract processing page -- Remove the back button and have the expand icon there in that place which allows for hiding the extras panel for contract processing page. Same way for all the details page -- hide all extras panel and just have the content on the centre expand across the width for better readability.  Add a chevron-up-down icon to the rifht of the ID in the Secondary nav label to help navigate across multiple line-items (bascially to avoid an index within the Customer 360 frame)
    - This popover should house a compact list of line items to navigate to without having a dedicated index page like All INVOICES page inside the Customer 360 frame for any of the tabs. Show the last 6-8 items and beyond that have a View More button text only in blue-700 -- on hover underlined state --. 

