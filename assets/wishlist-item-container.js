
  window.swymLandingURL = document.URL;
  window.swymCart = {{ cart | json }};
  console.log(window.swymCart.items)
  window.swymPageLoad = function(){
    window.SwymProductVariants = window.SwymProductVariants || {};
    window.SwymHasCartItems = {{ cart.item_count|json }} > 0;
    window.SwymPageData = {}, window.SwymProductInfo = {};
    {%- if product and template.name == 'product' -%}
        var variants = [];
        window.SwymProductInfo.product = {{ product | json }};
        console.log('제품리스트',window.SwymProductInfo.product)
        window.SwymProductInfo.variants = window.SwymProductInfo.product.variants;
        var piu = {{ product.featured_image | img_url: '620x620' | json }};
        
        {% if product.selected_or_first_available_variant %}
        {% assign currentVariant = product.selected_or_first_available_variant%}
        {% else %}
        {% assign currentVariant = product.variants[0] %}
        {%- endif -%}
        
        {%- for variant in product.variants -%}
          {% if variant.selected %}
            {% assign currentVariant = variant %}
          {% endif %}
          SwymProductVariants[{{variant.id|json}}] = {
            empi:window.SwymProductInfo.product.id,epi:{{variant.id|json}},
            dt: {{ product.title | json }},
            du: "{{ shop.url }}{{ product.url }}",
            iu: {% if variant.image %} {{ variant | img_url: '620x620' | json }} {% else %} piu {% endif %},
            stk: {{variant.inventory_quantity}},
            pr: {{variant.price}}/100,
            ct: window.SwymProductInfo.product.type,
            {% if variant.compare_at_price %} op: {{variant.compare_at_price}}/100, {% endif %}
            variants: [{ {{ variant.title | json }} : {{variant.id|json}}}]
          };
          
        {%- endfor -%}
        
        window.SwymProductInfo.currentVariant = {{currentVariant.id | json}};
        var product_data = {
          et: 1, empi: window.SwymProductInfo.product.id, epi: window.SwymProductInfo.currentVariant,
          dt: {{ product.title | json }}, du: "{{ shop.url }}{{ product.url }}",
          ct: window.SwymProductInfo.product.type, pr: {{ currentVariant.price }}/100,
          iu: {% if currentVariant.image %} {{ currentVariant | img_url: '620x620' | json }} {% else %} piu {% endif %}, variants: [{ {{currentVariant.title | json}} : {{currentVariant.id | json}} }],
          stk:{{ currentVariant.inventory_quantity }} {% if currentVariant.compare_at_price %} ,op:{{currentVariant.compare_at_price}}/100 {% endif %}
        };
        window.SwymPageData = product_data;
      
    {% elsif collection %}
      
        var collection = {{ collection | json }};
        console.log('콜렉션',collection);
        if (typeof collection === "undefined" || collection == null || collection.toString().trim() == ""){
          var unknown = {et: 0};
          window.SwymPageData = unknown;
        } else {
          var image = "";
          if (typeof collection.image === "undefined" || collection.image == null || collection.image.toString().trim() == ""){}
          else{image = collection.image.src;}
          var collection_data = {
            et: 2, dt: {{ collection.title | json}},
            du: "{{shop.url}}/collections/{{collection.handle}}", iu: image
          }
          window.SwymPageData = collection_data;
        }
  
    {% else %}
      
        var unknown = {et: 0};
        console.log('언논??',unknown)
        window.SwymPageData = unknown;
        
    {% endif %}
      console.log('유알엘',window.swymLandingURL);
      window.SwymPageData.uri = window.swymLandingURL;
    };

  if(window.selectCallback){
    (function(){
      // Variant select override
      var originalSelectCallback = window.selectCallback;
      window.selectCallback = function(variant){
        originalSelectCallback.apply(this, arguments);
        try{
          if(window.triggerSwymVariantEvent){
            window.triggerSwymVariantEvent(variant.id);
          }
        }catch(err){
          console.warn("Swym selectCallback", err);
        }
      };
    })();
  }
  window.swymCustomerId = {% if customer %}"{{ customer.id }}"{% else %}null{% endif %};
  window.swymCustomerExtraCheck = {% if customer and customer.tags.size > 0 %}true{% else %}null{% endif %};

  var swappName = ({{ shop.metafields.swym.app | json }} || "Wishlist");
  var swymJSObject = {
    pid: {{ shop.metafields.swym.pid | json }} || "NoNg1swWKxgELY9AjE6caUMf51SCJqiwJVO5/Azlx5s=",
    interface: "/apps/swym" + swappName + "/interfaces/interfaceStore.php?appname=" + swappName
  };
  window.swymJSShopifyLoad = function(){
    if(window.swymPageLoad) swymPageLoad();
    if(!window._swat) {
      (function (s, w, r, e, l, a, y) {
        r['SwymRetailerConfig'] = s;
        r[s] = r[s] || function (k, v) {
          r[s][k] = v;
        };
      })('_swrc', '', window);
      _swrc('RetailerId', swymJSObject.pid);
      _swrc('Callback', function(){initSwymShopify();});
    }else if(window._swat.postLoader){
      _swrc = window._swat.postLoader;
      _swrc('RetailerId', swymJSObject.pid);
      _swrc('Callback', function(){initSwymShopify();});
    }else{
      initSwymShopify();
    }
  }
  if(!window._SwymPreventAutoLoad) {
    swymJSShopifyLoad();
  }
  window.swymGetCartCookies = function(){
    var RequiredCookies = ["cart", "swym-session-id", "swym-swymRegid", "swym-email"];
    var reqdCookies = {};
    RequiredCookies.forEach(function(k){
      reqdCookies[k] = _swat.storage.getRaw(k);
    });
    var cart_token = window.swymCart.token;
    var data = {
        action:'cart',
        token:cart_token,
        cookies:reqdCookies
    };
    return data;
  }

  window.swymGetCustomerData = function(){
    {% if customer %}
    var regid = _swat.get(_swat.key.REGID);
    var swym_session_id = _swat.storage.getSessionId();
    var customer_id = "{{ customer.id }}";
    var data = {action: 'customer', regid:regid, customer_id:customer_id,swym_session_id:swym_session_id};
    return {status:0,data:data};
    {% else %}
    return {status:1};
    {% endif %}
  }

{% if customer %}

window.SwymCallbacks = window.SwymCallbacks || [];
window.SwymCallbacks.push(function(swat) {
  if(swat.isAlreadyAuth()) {
    var postLoginRedirect = swat.storage.get(swat.key.POSTLOGINRD);
    if(postLoginRedirect && postLoginRedirect != window.location) {
      swat.storage.remove(swat.key.POSTLOGINRD);
      window.location = postLoginRedirect;
    }
  }
});

{% endif %}