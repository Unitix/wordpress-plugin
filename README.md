# merchi-wordpress-plugin

<h3>Description</h3>
<p>The Merchi Plugin integrates with Woocommerce to pull your Merchi products into your Woocommerce store. It also provides access to the merchi shopping cart
feature, if enabled.
</p><p>
Note that This plugin requires Woocommerce to work. It also requires an
account on https://merchi.co/. The plugin uses the merchi API as a third party
service to integrate merchi products with Woocomerce. The merchi privacy policy
may be found here: https://merchi.co/privacy-policy/.
</p><p>
Upon activation, Merchi will disable some core Woocommerce functionlity, i.e., the ability to add products to cart and checkout. Instead we use the Merchi cart to fulfill these use cases.
</p><p>
For support you can contact me at: charlowspam@gmail.com
</p><p>
Merchi is available in English only at this time.
</p>
<h3>Usage</h3>
<p>Make Merchi compatible with your favourite Woocommerce themes! The Merchi plugin will import all of your Merchi products into Woocommerce. <em>Note: This plugin will deactivate some of the Woocommerce core functionality. It is not compatible with the Woocommerce shopping cart or checkout. I.e., you cannot sell Merchi products in combination with traditional Woocommerce products.</em></p>
</br>
<h3>Getting Started</h3>
<p>There are a few settings that will need to be configured in your <strong>Wordpress site</strong>, <strong>Woocommerce plugin</strong> and <strong>Merchi account</strong> in order for this plugin to operate as expected. Please use this guide to get started and as a reference for troubleshooing any errors.</p>
</br>
<h2><i>Let's Go</i></h2>
<h3>1. Get Woocommerce</h3>
<p>The Merchi plugin requires Woocommerce. Get started by ensuring you have the Woocommerce plugin installed and activated in your Wordpress site. For information on how to install and activate Woocommerce, visit: <a href="https://woocommerce.com/videos/installing-woocommerce/">Woocommerce.</a></p>
</br>
<h3>2. Activate Woocommerce API</h3>
<p>To get your API key, follow the screeshots below. <em>Note: Merchi and Woocommerce are configured in a way that requires you have a valid SSL certificate installed on your host. This API only works with Merchi over HTTPS.</em></p>
<img src="https://user-images.githubusercontent.com/7565117/86315679-21571100-bc6e-11ea-932a-1230b7de1893.png"/>
<img src="https://user-images.githubusercontent.com/7565117/86317575-1652af80-bc73-11ea-88c3-77e45e89a715.png"/>
<img src="https://user-images.githubusercontent.com/7565117/86315777-68dd9d00-bc6e-11ea-837d-b40dd2c84d1a.png"/>
</br>
<h3>3. Remove Woocommerce Generated Pages</h3>
<p>Since we are importing the <em>Merchi shopping cart component</em> (more on this later), we do not need the Woocommerce "Cart", "Checkout", and "My Account" pages. Let's go ahead and delete these. Follow the screenshot below.</p>
<img src="https://user-images.githubusercontent.com/7565117/86317458-c96ed900-bc72-11ea-8ad4-f15c5cb115d9.png" />
</br>
<h3>4. Get Merchi Plugin</h3>
<p>To install and activate the Merchi plugin, follow the screenshots below.</p>
</br>
<h3>5a. Configure Merchi Plugin</h3>
<p>Let's configure the settings for the Merchi plugin. Follow the screenshots below. <i>Note: Remember the API keys you saved from Woocommerce? You'd better have them handy because they're needed now.</i></p>
<img src="https://user-images.githubusercontent.com/7565117/86318163-94fc1c80-bc74-11ea-8914-65e9317a51c7.png" />
<p>Now let's get your Merchi domain ID. Go to <a href="https://merchi.co">Merchi.co</a> and login to your account.</p>
<img src="https://user-images.githubusercontent.com/7565117/86319093-fb823a00-bc76-11ea-851b-9f70134a2fb0.png" />
<p>Head back over to your Wordpress site and paste your ID.</p>
<img src="https://user-images.githubusercontent.com/7565117/86319335-a8f54d80-bc77-11ea-96aa-f83ce936e10b.png" />
<h3>5b. Identify Mount point class</h3>
<p>It's time to add a "mount point class". This can be a bit tricky if you are totally unfamiliar with web development, however I'm confident this guide can help overcome most knowledge gaps.</p> 
<p>The mount point class is used to intialise and render a Merchi shopping cart to your page. The Merchi plugin takes the string you provide and looks for an element on the page with that class name to render to. Eg., div class="<strong>shopping-dropdown</strong>" or span class="<strong>shopping-cart</strong>"; here the Merchi cart would mount to an element with the class shopping-dorpdown or shopping-cart, respectiely.</p>
<p>The goal here is to identify a fairly universal element in your Woocommerce theme that renders something like a shopping cart, or a shopping cart dropdown, and hijack it. An element of this sort can usually be found in the navigation. If not, we can modify the theme to add an element with a class to mount our Merchi cart to. However, let's not worry about modifying themes yet. For the purposes of this guide let's identify an element in the <a href="https://woocommerce.com/storefront/">Storefront</a> theme built by the guys over at Automatic (the authors of Woocommerce), and hijack it to mount the Merchi cart.</p>
<p>Go ahead and download and activate the Storefront theme on your Wordpress site. More information about installing themes can be found <a href="https://www.wpbeginner.com/beginners-guide/how-to-install-a-wordpress-theme/">here.</a></p>
<p>Once your theme is set up, we will head over to the home page and <strong>"inspect element"</strong> on what looks to be a good candidate for our universal shopping cart element. Follow the screenshot below.</p>
<img src="https://user-images.githubusercontent.com/7565117/86548539-22df4c80-bf80-11ea-872d-7399fa2b3aeb.png" />
<p>This will open up your "dom and style inspector". I'm using Firefox here, other browsers will look slightly different. Here we can identify the class associated with this element. Let's copy it and paste it into Merchi to see if it works. Follow the screenshots below.</p>
<img src="https://user-images.githubusercontent.com/7565117/86549252-70f54f80-bf82-11ea-8511-e83a5b889e46.png" />
<img src="https://user-images.githubusercontent.com/7565117/86550158-0265c100-bf85-11ea-95c1-229ce6f23255.png" />
<p>Now head back over to your home page and let's see if the Merchi cart initialises. See screenshot below; in the right hand corner, where the Woocommerce shopping cart used to be, the Merchi cart has taken its place!</p>
<img src="https://user-images.githubusercontent.com/7565117/86550671-6046d880-bf86-11ea-9f82-c63dcb79a27c.png" />
<p></p>

documentation

<ul>
	<li>install merchi plugin</li>
	<li>configure or check configurations of merchi account/products</li>
	<li>fetch merchi products</li>
	<li>add custom css</li>
	<li>change permalink stuff</li>
</ul>
