<?php
if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}


?>
<style>
    html {
        height: 100%
    }

    p {
        color: grey
    }

    #heading {
        text-transform: uppercase;
        color: #50bfd8;
        font-weight: normal
    }

    #msform {
        text-align: center;
        position: relative;
        margin-top: 20px
    }

    #msform fieldset {
        background: white;
        border: 0 none;
        border-radius: 0.5rem;
        box-sizing: border-box;
        width: 100%;
        margin: 0;
        padding-bottom: 20px;
        position: relative
    }

    .form-card {
        text-align: left
    }

    #msform fieldset:not(:first-of-type) {
        display: none
    }

    #msform input,
    #msform select,
    #msform textarea {
        padding: 8px 15px 8px 15px;
        border: 1px solid #ccc;
        border-radius: 0px;
        margin-bottom: 25px;
        margin-top: 2px;
        width: 100%;
        box-sizing: border-box;
        font-family: montserrat;
        color: #2C3E50;
        background-color: #ECEFF1;
        font-size: 16px;
        letter-spacing: 1px
    }

    #msform input:focus,
    #msform select:focus,
    #msform textarea:focus {
        -moz-box-shadow: none !important;
        -webkit-box-shadow: none !important;
        box-shadow: none !important;
        border: 1px solid #673AB7;
        outline-width: 0
    }


    #msform .action-button {
        width: 100px;
        background: #50bfd8;
        font-weight: bold;
        color: white;
        border: 0 none;
        border-radius: 0px;
        cursor: pointer;
        padding: 10px 5px;
        margin: 10px 0px 10px 5px;
        float: right
    }

    #msform .action-button:hover,
    #msform .action-button:focus {
        background-color: #50bfd8
    }

    #msform .action-button-previous {
        width: 100px;
        background: #616161;
        font-weight: bold;
        color: white;
        border: 0 none;
        border-radius: 0px;
        cursor: pointer;
        padding: 10px 5px;
        margin: 10px 5px 10px 0px;
        float: right
    }

    #msform .action-button-previous:hover,
    #msform .action-button-previous:focus {
        background-color: #000000
    }

    .card {
        z-index: 0;
        border: none;
        position: relative
    }

    .fs-title {
        font-size: 25px;
        color: #50bfd8;
        margin-bottom: 15px;
        font-weight: bold;
        text-align: left;
    }

    .purple-text {
        color: #50bfd8;
        font-weight: normal
    }

    .steps {
        font-size: 25px;
        color: gray;
        margin-bottom: 10px;
        font-weight: normal;
        text-align: right
    }

    .fieldlabels {
        color: gray;
        text-align: left
    }

    #progressbar {
        margin-bottom: 30px;
        overflow: hidden;
        color: lightgrey
    }

    #progressbar .active {
        color: #50bfd8
    }

    #progressbar li {
        list-style-type: none;
        font-size: 15px;
        width: 25%;
        float: left;
        position: relative;
        font-weight: 400
    }

    #progressbar #account:before {
        font-family: FontAwesome;
        content: "\1F516"
    }

    #progressbar #personal:before {
        font-family: FontAwesome;
        content: "\1F6D2"
    }

    #progressbar #payment:before {
        font-family: FontAwesome;
        content: "\1F4B0"
    }

    #progressbar #confirm:before {
        font-family: FontAwesome;
        content: "\f00c"
    }

    #progressbar li:before {
        width: 50px;
        height: 50px;
        line-height: 45px;
        display: block;
        font-size: 20px;
        color: #ffffff;
        background: lightgray;
        border-radius: 50%;
        margin: 0 auto 10px auto;
        padding: 2px
    }

    #progressbar li:after {
        content: '';
        width: 100%;
        height: 2px;
        background: lightgray;
        position: absolute;
        left: 0;
        top: 25px;
        z-index: -1
    }

    #progressbar li.active:before,
    #progressbar li.active:after {
        background: #50bfd8
    }

    .progress {
        height: 20px
    }

    .progress-bar {
        background-color: #50bfd8
    }

    .fit-image {
        width: 100%;
        object-fit: cover
    }

    /* .container {
        display: flex;
        justify-content: center;
        text-align: left;
    }

    .inner-container {
        padding-right: 3rem;
        padding-bottom: 1rem;
        padding-left: 3rem;
        width: 700px;
    } */

    .icon {
        padding-bottom: 0.5rem;
        padding-top: 0.5rem;
        text-align: center;
    }

    .icon svg {
        /* Add any additional SVG styling here */
    }

    .message {
        margin-top: 3rem;
        text-align: center;
        font-weight: bold;
    }


    .error-message {
        color: red;
    }


    .shipment-container {
        margin-bottom: 10px;
    }

    .shipment-title {
        font-weight: bold;
    }

    .shipment-option {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .shipment-info {
        flex: 1;
    }

    .shipment-price {
        font-weight: bold;
    }
</style>

<body>
    <div class="container-fluid">
        <div class="row justify-content-center">
            <div class="col-11 col-sm-10 col-md-10 col-lg-6 col-xl-5 text-center p-0 mt-3 mb-2">
                <div class="card px-0 pt-4 pb-0 mt-3 mb-3">
                    <form id="msform" method="POST">
                        <!-- progressbar -->
                        <ul id="progressbar">
                            <li class="active" id="account"><strong>Billing</strong></li>
                            <li id="personal"><strong>Shipment</strong></li>
                            <li id="payment"><strong>Payment</strong></li>
                            <li id="confirm"><strong>Finish</strong></li>
                        </ul>
                        <div class="progress">
                            <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar"
                                aria-valuemin="0" aria-valuemax="100"></div>
                        </div> <br> <!-- fieldsets -->
                        <fieldset>
                            <div class="form-card">
                                <div class="row">
                                    <div style="justify-content: center; margin: auto;">
                                        <h2 class="fs-title">Billing details</h2>
                                    </div>
                                </div>

                                <div id="customer_details">
                                    <div class="woocommerce-billing-fields clearfix">
                                        <h3>Billing details</h3>
                                        <div class="woocommerce-billing-fields__field-wrapper">
                                            <p class="form-row form-row-first validate-required"
                                                id="billing_first_name_field" data-priority="10">
                                                <label for="billing_first_name" class="">First name&nbsp;<abbr
                                                        class="required" title="required">Required</abbr></label>
                                                <span class="woocommerce-input-wrapper">
                                                    <input type="text" class="input-text " name="billing_first_name"
                                                        id="billing_first_name" placeholder="" value=""
                                                        autocomplete="given-name">
                                                </span>
                                            </p>
                                            <p class="form-row form-row-last validate-required"
                                                id="billing_last_name_field" data-priority="20">
                                                <label for="billing_last_name" class="">Last name&nbsp;<abbr
                                                        class="required" title="required">Required</abbr></label>
                                                <span class="woocommerce-input-wrapper">
                                                    <input type="text" class="input-text " name="billing_last_name"
                                                        id="billing_last_name" placeholder="" value=""
                                                        autocomplete="family-name">
                                                </span>
                                            </p>
                                            <p class="form-row form-row-wide" id="billing_company_field"
                                                data-priority="30">
                                                <label for="billing_company" class="">Company name&nbsp;<span
                                                        class="optional">(optional)</span></label>
                                                <span class="woocommerce-input-wrapper">
                                                    <input type="text" class="input-text " name="billing_company"
                                                        id="billing_company" placeholder="" value=""
                                                        autocomplete="organization">
                                                </span>
                                            </p>

                                            <p class="form-row form-row-wide address-field update_totals_on_change validate-required"
                                                id="billing_country_field" data-priority="40">
                                                <label for="billing_country" class="">Country / Region&nbsp;<abbr
                                                        class="required" title="required">Required</abbr></label>
                                                <span class="woocommerce-input-wrapper">
                                                    <select name="billing_country" id="billing_country"
                                                        class="country_to_state country_select select2-hidden-accessible"
                                                        autocomplete="country" tabindex="-1" aria-hidden="true">
                                                        <option value="AF">Afghanistan</option>
                                                        <option value="AX">Aland Islands</option>
                                                        <option value="AL">Albania</option>
                                                        <option value="DZ">Algeria</option>
                                                        <option value="AS">American Samoa</option>
                                                        <option value="AD">Andorra</option>
                                                        <option value="AO">Angola</option>
                                                        <option value="AI">Anguilla</option>
                                                        <option value="AQ">Antarctica</option>
                                                        <option value="AG">Antigua and Barbuda</option>
                                                        <option value="AR">Argentina</option>
                                                        <option value="AM">Armenia</option>
                                                        <option value="AW">Aruba</option>
                                                        <option value="AU">Australia</option>
                                                        <option value="AT">Austria</option>
                                                        <option value="AZ">Azerbaijan</option>
                                                        <option value="BS">Bahamas</option>
                                                        <option value="BH">Bahrain</option>
                                                        <option value="BD">Bangladesh</option>
                                                        <option value="BB">Barbados</option>
                                                        <option value="BY">Belarus</option>
                                                        <option value="BE">Belgium</option>
                                                        <option value="BZ">Belize</option>
                                                        <option value="BJ">Benin</option>
                                                        <option value="BM">Bermuda</option>
                                                        <option value="BT">Bhutan</option>
                                                        <option value="BO">Bolivia</option>
                                                        <option value="BQ">Bonaire, Sint Eustatius and Saba</option>
                                                        <option value="BA">Bosnia and Herzegovina</option>
                                                        <option value="BW">Botswana</option>
                                                        <option value="BV">Bouvet Island</option>
                                                        <option value="BR">Brazil</option>
                                                        <option value="IO">British Indian Ocean Territory</option>
                                                        <option value="BN">Brunei Darussalam</option>
                                                        <option value="BG">Bulgaria</option>
                                                        <option value="BF">Burkina Faso</option>
                                                        <option value="BI">Burundi</option>
                                                        <option value="KH">Cambodia</option>
                                                        <option value="CM">Cameroon</option>
                                                        <option value="CA">Canada</option>
                                                        <option value="CV">Cape Verde</option>
                                                        <option value="KY">Cayman Islands</option>
                                                        <option value="CF">Central African Republic</option>
                                                        <option value="TD">Chad</option>
                                                        <option value="CL">Chile</option>
                                                        <option value="CN">China</option>
                                                        <option value="CX">Christmas Island</option>
                                                        <option value="CC">Cocos (Keeling) Islands</option>
                                                        <option value="CO">Colombia</option>
                                                        <option value="KM">Comoros</option>
                                                        <option value="CG">Congo</option>
                                                        <option value="CD">Congo, Democratic Republic of the Congo
                                                        </option>
                                                        <option value="CK">Cook Islands</option>
                                                        <option value="CR">Costa Rica</option>
                                                        <option value="CI">Cote D'Ivoire</option>
                                                        <option value="HR">Croatia</option>
                                                        <option value="CU">Cuba</option>
                                                        <option value="CW">Curacao</option>
                                                        <option value="CY">Cyprus</option>
                                                        <option value="CZ">Czech Republic</option>
                                                        <option value="DK">Denmark</option>
                                                        <option value="DJ">Djibouti</option>
                                                        <option value="DM">Dominica</option>
                                                        <option value="DO">Dominican Republic</option>
                                                        <option value="EC">Ecuador</option>
                                                        <option value="EG">Egypt</option>
                                                        <option value="SV">El Salvador</option>
                                                        <option value="GQ">Equatorial Guinea</option>
                                                        <option value="ER">Eritrea</option>
                                                        <option value="EE">Estonia</option>
                                                        <option value="ET">Ethiopia</option>
                                                        <option value="FK">Falkland Islands (Malvinas)</option>
                                                        <option value="FO">Faroe Islands</option>
                                                        <option value="FJ">Fiji</option>
                                                        <option value="FI">Finland</option>
                                                        <option value="FR">France</option>
                                                        <option value="GF">French Guiana</option>
                                                        <option value="PF">French Polynesia</option>
                                                        <option value="TF">French Southern Territories</option>
                                                        <option value="GA">Gabon</option>
                                                        <option value="GM">Gambia</option>
                                                        <option value="GE">Georgia</option>
                                                        <option value="DE">Germany</option>
                                                        <option value="GH">Ghana</option>
                                                        <option value="GI">Gibraltar</option>
                                                        <option value="GR">Greece</option>
                                                        <option value="GL">Greenland</option>
                                                        <option value="GD">Grenada</option>
                                                        <option value="GP">Guadeloupe</option>
                                                        <option value="GU">Guam</option>
                                                        <option value="GT">Guatemala</option>
                                                        <option value="GG">Guernsey</option>
                                                        <option value="GN">Guinea</option>
                                                        <option value="GW">Guinea-Bissau</option>
                                                        <option value="GY">Guyana</option>
                                                        <option value="HT">Haiti</option>
                                                        <option value="HM">Heard Island and Mcdonald Islands</option>
                                                        <option value="VA">Holy See (Vatican City State)</option>
                                                        <option value="HN">Honduras</option>
                                                        <option value="HK">Hong Kong</option>
                                                        <option value="HU">Hungary</option>
                                                        <option value="IS">Iceland</option>
                                                        <option value="IN">India</option>
                                                        <option value="ID">Indonesia</option>
                                                        <option value="IR">Iran, Islamic Republic of</option>
                                                        <option value="IQ">Iraq</option>
                                                        <option value="IE">Ireland</option>
                                                        <option value="IM">Isle of Man</option>
                                                        <option value="IL">Israel</option>
                                                        <option value="IT">Italy</option>
                                                        <option value="JM">Jamaica</option>
                                                        <option value="JP">Japan</option>
                                                        <option value="JE">Jersey</option>
                                                        <option value="JO">Jordan</option>
                                                        <option value="KZ">Kazakhstan</option>
                                                        <option value="KE">Kenya</option>
                                                        <option value="KI">Kiribati</option>
                                                        <option value="KP">Korea, Democratic People's Republic of
                                                        </option>
                                                        <option value="KR">Korea, Republic of</option>
                                                        <option value="XK">Kosovo</option>
                                                        <option value="KW">Kuwait</option>
                                                        <option value="KG">Kyrgyzstan</option>
                                                        <option value="LA">Lao People's Democratic Republic</option>
                                                        <option value="LV">Latvia</option>
                                                        <option value="LB">Lebanon</option>
                                                        <option value="LS">Lesotho</option>
                                                        <option value="LR">Liberia</option>
                                                        <option value="LY">Libyan Arab Jamahiriya</option>
                                                        <option value="LI">Liechtenstein</option>
                                                        <option value="LT">Lithuania</option>
                                                        <option value="LU">Luxembourg</option>
                                                        <option value="MO">Macao</option>
                                                        <option value="MK">Macedonia, the Former Yugoslav Republic of
                                                        </option>
                                                        <option value="MG">Madagascar</option>
                                                        <option value="MW">Malawi</option>
                                                        <option value="MY">Malaysia</option>
                                                        <option value="MV">Maldives</option>
                                                        <option value="ML">Mali</option>
                                                        <option value="MT">Malta</option>
                                                        <option value="MH">Marshall Islands</option>
                                                        <option value="MQ">Martinique</option>
                                                        <option value="MR">Mauritania</option>
                                                        <option value="MU">Mauritius</option>
                                                        <option value="YT">Mayotte</option>
                                                        <option value="MX">Mexico</option>
                                                        <option value="FM">Micronesia, Federated States of</option>
                                                        <option value="MD">Moldova, Republic of</option>
                                                        <option value="MC">Monaco</option>
                                                        <option value="MN">Mongolia</option>
                                                        <option value="ME">Montenegro</option>
                                                        <option value="MS">Montserrat</option>
                                                        <option value="MA">Morocco</option>
                                                        <option value="MZ">Mozambique</option>
                                                        <option value="MM">Myanmar</option>
                                                        <option value="NA">Namibia</option>
                                                        <option value="NR">Nauru</option>
                                                        <option value="NP">Nepal</option>
                                                        <option value="NL">Netherlands</option>
                                                        <option value="AN">Netherlands Antilles</option>
                                                        <option value="NC">New Caledonia</option>
                                                        <option value="NZ">New Zealand</option>
                                                        <option value="NI">Nicaragua</option>
                                                        <option value="NE">Niger</option>
                                                        <option value="NG">Nigeria</option>
                                                        <option value="NU">Niue</option>
                                                        <option value="NF">Norfolk Island</option>
                                                        <option value="MP">Northern Mariana Islands</option>
                                                        <option value="NO">Norway</option>
                                                        <option value="OM">Oman</option>
                                                        <option value="PK">Pakistan</option>
                                                        <option value="PW">Palau</option>
                                                        <option value="PS">Palestinian Territory, Occupied</option>
                                                        <option value="PA">Panama</option>
                                                        <option value="PG">Papua New Guinea</option>
                                                        <option value="PY">Paraguay</option>
                                                        <option value="PE">Peru</option>
                                                        <option value="PH">Philippines</option>
                                                        <option value="PN">Pitcairn</option>
                                                        <option value="PL">Poland</option>
                                                        <option value="PT">Portugal</option>
                                                        <option value="PR">Puerto Rico</option>
                                                        <option value="QA">Qatar</option>
                                                        <option value="RE">Reunion</option>
                                                        <option value="RO">Romania</option>
                                                        <option value="RU">Russian Federation</option>
                                                        <option value="RW">Rwanda</option>
                                                        <option value="BL">Saint Barthelemy</option>
                                                        <option value="SH">Saint Helena</option>
                                                        <option value="KN">Saint Kitts and Nevis</option>
                                                        <option value="LC">Saint Lucia</option>
                                                        <option value="MF">Saint Martin</option>
                                                        <option value="PM">Saint Pierre and Miquelon</option>
                                                        <option value="VC">Saint Vincent and the Grenadines</option>
                                                        <option value="WS">Samoa</option>
                                                        <option value="SM">San Marino</option>
                                                        <option value="ST">Sao Tome and Principe</option>
                                                        <option value="SA">Saudi Arabia</option>
                                                        <option value="SN">Senegal</option>
                                                        <option value="RS">Serbia</option>
                                                        <option value="CS">Serbia and Montenegro</option>
                                                        <option value="SC">Seychelles</option>
                                                        <option value="SL">Sierra Leone</option>
                                                        <option value="SG">Singapore</option>
                                                        <option value="SX">Sint Maarten</option>
                                                        <option value="SK">Slovakia</option>
                                                        <option value="SI">Slovenia</option>
                                                        <option value="SB">Solomon Islands</option>
                                                        <option value="SO">Somalia</option>
                                                        <option value="ZA">South Africa</option>
                                                        <option value="GS">South Georgia and the South Sandwich Islands
                                                        </option>
                                                        <option value="SS">South Sudan</option>
                                                        <option value="ES">Spain</option>
                                                        <option value="LK">Sri Lanka</option>
                                                        <option value="SD">Sudan</option>
                                                        <option value="SR">Suriname</option>
                                                        <option value="SJ">Svalbard and Jan Mayen</option>
                                                        <option value="SZ">Swaziland</option>
                                                        <option value="SE">Sweden</option>
                                                        <option value="CH">Switzerland</option>
                                                        <option value="SY">Syrian Arab Republic</option>
                                                        <option value="TW">Taiwan, Province of China</option>
                                                        <option value="TJ">Tajikistan</option>
                                                        <option value="TZ">Tanzania, United Republic of</option>
                                                        <option value="TH">Thailand</option>
                                                        <option value="TL">Timor-Leste</option>
                                                        <option value="TG">Togo</option>
                                                        <option value="TK">Tokelau</option>
                                                        <option value="TO">Tonga</option>
                                                        <option value="TT">Trinidad and Tobago</option>
                                                        <option value="TN">Tunisia</option>
                                                        <option value="TR">Turkey</option>
                                                        <option value="TM">Turkmenistan</option>
                                                        <option value="TC">Turks and Caicos Islands</option>
                                                        <option value="TV">Tuvalu</option>
                                                        <option value="UG">Uganda</option>
                                                        <option value="UA">Ukraine</option>
                                                        <option value="AE">United Arab Emirates</option>
                                                        <option value="GB">United Kingdom</option>
                                                        <option value="US">United States</option>
                                                        <option value="UM">United States Minor Outlying Islands</option>
                                                        <option value="UY">Uruguay</option>
                                                        <option value="UZ">Uzbekistan</option>
                                                        <option value="VU">Vanuatu</option>
                                                        <option value="VE">Venezuela</option>
                                                        <option value="VN">Viet Nam</option>
                                                        <option value="VG">Virgin Islands, British</option>
                                                        <option value="VI">Virgin Islands, U.s.</option>
                                                        <option value="WF">Wallis and Futuna</option>
                                                        <option value="EH">Western Sahara</option>
                                                        <option value="YE">Yemen</option>
                                                        <option value="ZM">Zambia</option>
                                                        <option value="ZW">Zimbabwe</option>
                                                    </select>
                                                </span>
                                                <noscript>
                                                    <button type="submit" name="woocommerce_checkout_update_totals"
                                                        value="Update country / region">Update country / region</button>
                                                </noscript>
                                            </p>

                                            <p class="form-row form-row-wide address-field validate-required"
                                                id="billing_address_1_field" data-priority="50">
                                                <label for="billing_address_1" class="">Street address&nbsp;<abbr
                                                        class="required" title="required">Required</abbr></label>
                                                <span class="woocommerce-input-wrapper">
                                                    <input type="text" class="input-text " name="billing_address_1"
                                                        id="billing_address_1"
                                                        placeholder="House number and street name" value=""
                                                        autocomplete="address-line1"
                                                        data-placeholder="House number and street name">
                                                </span>
                                            </p>
                                            <p class="form-row form-row-wide address-field" id="billing_address_2_field"
                                                data-priority="60">
                                                <label for="billing_address_2" class="screen-reader-text">Apartment,
                                                    suite, unit, etc. (optional)&nbsp;<span
                                                        class="optional">(optional)</span></label>
                                                <span class="woocommerce-input-wrapper">
                                                    <input type="text" class="input-text " name="billing_address_2"
                                                        id="billing_address_2"
                                                        placeholder="Apartment, suite, unit, etc. (optional)" value="">
                                                </span>
                                            </p>
                                            <p class="form-row form-row-wide address-field validate-required"
                                                id="billing_city_field" data-priority="70"
                                                data-o_class="form-row form-row-wide address-field validate-required">
                                                <label for="billing_city" class="">Suburb&nbsp;<abbr class="required"
                                                        title="required">Required</abbr></label>
                                                <span class="woocommerce-input-wrapper">
                                                    <input type="text" class="input-text " name="billing_city"
                                                        id="billing_city" placeholder="" value=""
                                                        autocomplete="address-level2">
                                                </span>
                                            </p>
                                            <p class="form-row form-row-wide address-field validate-required validate-state"
                                                id="billing_state_field" data-priority="80"
                                                data-o_class="form-row form-row-wide address-field validate-required validate-state">
                                                <label for="billing_state" class="">State&nbsp;<abbr class="required"
                                                        title="required">Required</abbr></label>
                                                <span class="woocommerce-input-wrapper">
                                                    <select name="billing_state" id="billing_state"
                                                        class="state_select select2-hidden-accessible"
                                                        autocomplete="address-level1"
                                                        data-placeholder="Select an option…" data-input-classes=""
                                                        tabindex="-1" aria-hidden="true">
                                                        <option value="">Select an option…</option>
                                                    </select>
                                                </span>
                                            </p>
                                            <p class="form-row form-row-wide address-field validate-required validate-postcode"
                                                id="billing_postcode_field" data-priority="90"
                                                data-o_class="form-row form-row-wide address-field validate-required validate-postcode">
                                                <label for="billing_postcode" class="">Postcode&nbsp;<abbr
                                                        class="required" title="required">Required</abbr></label>
                                                <span class="woocommerce-input-wrapper">
                                                    <input type="text" class="input-text " name="billing_postcode"
                                                        id="billing_postcode" placeholder="" value=""
                                                        autocomplete="postal-code">
                                                </span>
                                            </p>
                                            <p class="form-row form-row-wide validate-required validate-phone"
                                                id="billing_phone_field" data-priority="100">
                                                <label for="billing_phone" class="">Phone&nbsp;<abbr class="required"
                                                        title="required">Required</abbr></label>
                                                <span class="woocommerce-input-wrapper">
                                                    <input type="tel" class="input-text " name="billing_phone"
                                                        id="billing_phone" placeholder="" value="" autocomplete="tel">
                                                </span>
                                            </p>
                                            <p class="form-row form-row-wide validate-required validate-email"
                                                id="billing_email_field" data-priority="110">
                                                <label for="billing_email" class="">Email address&nbsp;<abbr
                                                        class="required" title="required">Required</abbr></label>
                                                <span class="woocommerce-input-wrapper">
                                                    <input type="email" class="input-text " name="billing_email"
                                                        id="billing_email" placeholder="" value="richard@unitix.com.au"
                                                        autocomplete="email username">
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    <div class="woocommerce-shipping-fields mb-4">
                                    </div>

                                    <div class="woocommerce-additional-fields">
                                        <h3>Additional information</h3>
                                        <div class="woocommerce-additional-fields__field-wrapper">
                                            <p class="form-row notes" id="order_comments_field" data-priority="">
                                                <label for="order_comments" class="">Order notes&nbsp;<span
                                                        class="optional">(optional)</span></label>
                                                <span class="woocommerce-input-wrapper">
                                                    <textarea name="order_comments" class="input-text "
                                                        id="order_comments"
                                                        placeholder="Notes about your order, e.g. special notes for delivery."
                                                        rows="2" cols="5"></textarea>
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                            </div>
                            <input type="button" name="next" class="next action-button" value="Next"
                                onclick="saveFormData()" />
                        </fieldset>
                        <fieldset>

                            <div id="divshipingroup">
                                <div class="container">
                                    <div class="inner-container">
                                        <div class="icon">
                                            <svg aria-hidden="true" focusable="false" data-prefix="fas"
                                                data-icon="truck" class="svg-inline--fa fa-truck fa-w-20 fa-2x "
                                                role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
                                                <path fill="currentColor"
                                                    d="M624 352h-16V243.9c0-12.7-5.1-24.9-14.1-33.9L494 110.1c-9-9-21.2-14.1-33.9-14.1H416V48c0-26.5-21.5-48-48-48H48C21.5 0 0 21.5 0 48v320c0 26.5 21.5 48 48 48h16c0 53 43 96 96 96s96-43 96-96h128c0 53 43 96 96 96s96-43 96-96h48c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16zM160 464c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48zm320 0c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48zm80-208H416V144h44.1l99.9 99.9V256z">
                                                </path>
                                            </svg>
                                            <br>
                                            <div class="mt-3">
                                                <strong>Select a shipment method</strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="shipment-option">
                                    <div class="shipment-info">
                                        <span style="font-weight: bold;">Shipment contents:</span><br>
                                        <span id="productNames" style="list-style-type: disc; margin-bottom: 5px;"></span><br>
                                    </div>
                                </div>
                                <div class="shipment-container">
                                    <ul class="list-group" id="shipmentList">
                                        <!-- Existing list items will go here -->
                                    </ul>
                                </div>
                                <div class="shipment-option">
                                    <div class="shipment-info">
                                        <span id="subtotal" style="font-weight: bold"></span><br>
                                        <span id="shipping" style="font-weight: bold"></span><br>
                                        <span id="total" style="font-weight: bold"></span>
                                    </div>
                                </div>
                            </div>

                            <div class="form-card" id="createUser">
                                <div class="row">
                                    <div style="justify-content: center; margin: auto;">
                                        <h2 class="fs-title">Shipping details</h2>
                                    </div>
                                </div>
                                <div>
                                    <div style="padding-bottom: 0.5rem; padding-top: 0.5rem; text-align: center;">
                                        <svg aria-hidden="true" focusable="false" data-prefix="fas"
                                            data-icon="user-plus" class="svg-inline--fa fa-user-plus fa-w-20 fa-2x "
                                            role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
                                            <path fill="currentColor"
                                                d="M624 208h-64v-64c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v64h-64c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h64v64c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-64h64c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16zm-400 48c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4z">
                                            </path>
                                        </svg>
                                        <br>
                                        <div>
                                            <strong>Checkout as new customer</strong>
                                        </div>
                                    </div>

                                    <div>
                                        <input name="username" id="username" placeholder="Name">
                                        <span class="text-danger"></span>
                                    </div>
                                    <div>
                                        <input name="newMail" id="newMail" placeholder="Email address">
                                        <span class="text-danger"></span>
                                    </div>
                                    <div class="row">
                                        <div class="col-sm-4" style="font-size: 14px">
                                            <select name="phoneNumbercode" id="phoneNumbercode">
                                                <option value="AF">Afghanistan</option>
                                                <option value="AX">Aland Islands</option>
                                                <option value="AL">Albania</option>
                                                <option value="DZ">Algeria</option>
                                                <option value="AS">American Samoa</option>
                                                <option value="AD">Andorra</option>
                                                <option value="AO">Angola</option>
                                                <option value="AI">Anguilla</option>
                                                <option value="AQ">Antarctica</option>
                                                <option value="AG">Antigua and Barbuda</option>
                                                <option value="AR">Argentina</option>
                                                <option value="AM">Armenia</option>
                                                <option value="AW">Aruba</option>
                                                <option value="AU">Australia</option>
                                                <option value="AT">Austria</option>
                                                <option value="AZ">Azerbaijan</option>
                                                <option value="BS">Bahamas</option>
                                                <option value="BH">Bahrain</option>
                                                <option value="BD">Bangladesh</option>
                                                <option value="BB">Barbados</option>
                                                <option value="BY">Belarus</option>
                                                <option value="BE">Belgium</option>
                                                <option value="BZ">Belize</option>
                                                <option value="BJ">Benin</option>
                                                <option value="BM">Bermuda</option>
                                                <option value="BT">Bhutan</option>
                                                <option value="BO">Bolivia</option>
                                                <option value="BQ">Bonaire, Sint Eustatius and Saba</option>
                                                <option value="BA">Bosnia and Herzegovina</option>
                                                <option value="BW">Botswana</option>
                                                <option value="BV">Bouvet Island</option>
                                                <option value="BR">Brazil</option>
                                                <option value="IO">British Indian Ocean Territory</option>
                                                <option value="BN">Brunei Darussalam</option>
                                                <option value="BG">Bulgaria</option>
                                                <option value="BF">Burkina Faso</option>
                                                <option value="BI">Burundi</option>
                                                <option value="KH">Cambodia</option>
                                                <option value="CM">Cameroon</option>
                                                <option value="CA">Canada</option>
                                                <option value="CV">Cape Verde</option>
                                                <option value="KY">Cayman Islands</option>
                                                <option value="CF">Central African Republic</option>
                                                <option value="TD">Chad</option>
                                                <option value="CL">Chile</option>
                                                <option value="CN">China</option>
                                                <option value="CX">Christmas Island</option>
                                                <option value="CC">Cocos (Keeling) Islands</option>
                                                <option value="CO">Colombia</option>
                                                <option value="KM">Comoros</option>
                                                <option value="CG">Congo</option>
                                                <option value="CD">Congo, Democratic Republic of the Congo</option>
                                                <option value="CK">Cook Islands</option>
                                                <option value="CR">Costa Rica</option>
                                                <option value="CI">Cote D'Ivoire</option>
                                                <option value="HR">Croatia</option>
                                                <option value="CU">Cuba</option>
                                                <option value="CW">Curacao</option>
                                                <option value="CY">Cyprus</option>
                                                <option value="CZ">Czech Republic</option>
                                                <option value="DK">Denmark</option>
                                                <option value="DJ">Djibouti</option>
                                                <option value="DM">Dominica</option>
                                                <option value="DO">Dominican Republic</option>
                                                <option value="EC">Ecuador</option>
                                                <option value="EG">Egypt</option>
                                                <option value="SV">El Salvador</option>
                                                <option value="GQ">Equatorial Guinea</option>
                                                <option value="ER">Eritrea</option>
                                                <option value="EE">Estonia</option>
                                                <option value="ET">Ethiopia</option>
                                                <option value="FK">Falkland Islands (Malvinas)</option>
                                                <option value="FO">Faroe Islands</option>
                                                <option value="FJ">Fiji</option>
                                                <option value="FI">Finland</option>
                                                <option value="FR">France</option>
                                                <option value="GF">French Guiana</option>
                                                <option value="PF">French Polynesia</option>
                                                <option value="TF">French Southern Territories</option>
                                                <option value="GA">Gabon</option>
                                                <option value="GM">Gambia</option>
                                                <option value="GE">Georgia</option>
                                                <option value="DE">Germany</option>
                                                <option value="GH">Ghana</option>
                                                <option value="GI">Gibraltar</option>
                                                <option value="GR">Greece</option>
                                                <option value="GL">Greenland</option>
                                                <option value="GD">Grenada</option>
                                                <option value="GP">Guadeloupe</option>
                                                <option value="GU">Guam</option>
                                                <option value="GT">Guatemala</option>
                                                <option value="GG">Guernsey</option>
                                                <option value="GN">Guinea</option>
                                                <option value="GW">Guinea-Bissau</option>
                                                <option value="GY">Guyana</option>
                                                <option value="HT">Haiti</option>
                                                <option value="HM">Heard Island and Mcdonald Islands</option>
                                                <option value="VA">Holy See (Vatican City State)</option>
                                                <option value="HN">Honduras</option>
                                                <option value="HK">Hong Kong</option>
                                                <option value="HU">Hungary</option>
                                                <option value="IS">Iceland</option>
                                                <option value="IN">India</option>
                                                <option value="ID">Indonesia</option>
                                                <option value="IR">Iran, Islamic Republic of</option>
                                                <option value="IQ">Iraq</option>
                                                <option value="IE">Ireland</option>
                                                <option value="IM">Isle of Man</option>
                                                <option value="IL">Israel</option>
                                                <option value="IT">Italy</option>
                                                <option value="JM">Jamaica</option>
                                                <option value="JP">Japan</option>
                                                <option value="JE">Jersey</option>
                                                <option value="JO">Jordan</option>
                                                <option value="KZ">Kazakhstan</option>
                                                <option value="KE">Kenya</option>
                                                <option value="KI">Kiribati</option>
                                                <option value="KP">Korea, Democratic People's Republic of</option>
                                                <option value="KR">Korea, Republic of</option>
                                                <option value="XK">Kosovo</option>
                                                <option value="KW">Kuwait</option>
                                                <option value="KG">Kyrgyzstan</option>
                                                <option value="LA">Lao People's Democratic Republic</option>
                                                <option value="LV">Latvia</option>
                                                <option value="LB">Lebanon</option>
                                                <option value="LS">Lesotho</option>
                                                <option value="LR">Liberia</option>
                                                <option value="LY">Libyan Arab Jamahiriya</option>
                                                <option value="LI">Liechtenstein</option>
                                                <option value="LT">Lithuania</option>
                                                <option value="LU">Luxembourg</option>
                                                <option value="MO">Macao</option>
                                                <option value="MK">Macedonia, the Former Yugoslav Republic of
                                                </option>
                                                <option value="MG">Madagascar</option>
                                                <option value="MW">Malawi</option>
                                                <option value="MY">Malaysia</option>
                                                <option value="MV">Maldives</option>
                                                <option value="ML">Mali</option>
                                                <option value="MT">Malta</option>
                                                <option value="MH">Marshall Islands</option>
                                                <option value="MQ">Martinique</option>
                                                <option value="MR">Mauritania</option>
                                                <option value="MU">Mauritius</option>
                                                <option value="YT">Mayotte</option>
                                                <option value="MX">Mexico</option>
                                                <option value="FM">Micronesia, Federated States of</option>
                                                <option value="MD">Moldova, Republic of</option>
                                                <option value="MC">Monaco</option>
                                                <option value="MN">Mongolia</option>
                                                <option value="ME">Montenegro</option>
                                                <option value="MS">Montserrat</option>
                                                <option value="MA">Morocco</option>
                                                <option value="MZ">Mozambique</option>
                                                <option value="MM">Myanmar</option>
                                                <option value="NA">Namibia</option>
                                                <option value="NR">Nauru</option>
                                                <option value="NP">Nepal</option>
                                                <option value="NL">Netherlands</option>
                                                <option value="AN">Netherlands Antilles</option>
                                                <option value="NC">New Caledonia</option>
                                                <option value="NZ">New Zealand</option>
                                                <option value="NI">Nicaragua</option>
                                                <option value="NE">Niger</option>
                                                <option value="NG">Nigeria</option>
                                                <option value="NU">Niue</option>
                                                <option value="NF">Norfolk Island</option>
                                                <option value="MP">Northern Mariana Islands</option>
                                                <option value="NO">Norway</option>
                                                <option value="OM">Oman</option>
                                                <option value="PK">Pakistan</option>
                                                <option value="PW">Palau</option>
                                                <option value="PS">Palestinian Territory, Occupied</option>
                                                <option value="PA">Panama</option>
                                                <option value="PG">Papua New Guinea</option>
                                                <option value="PY">Paraguay</option>
                                                <option value="PE">Peru</option>
                                                <option value="PH">Philippines</option>
                                                <option value="PN">Pitcairn</option>
                                                <option value="PL">Poland</option>
                                                <option value="PT">Portugal</option>
                                                <option value="PR">Puerto Rico</option>
                                                <option value="QA">Qatar</option>
                                                <option value="RE">Reunion</option>
                                                <option value="RO">Romania</option>
                                                <option value="RU">Russian Federation</option>
                                                <option value="RW">Rwanda</option>
                                                <option value="BL">Saint Barthelemy</option>
                                                <option value="SH">Saint Helena</option>
                                                <option value="KN">Saint Kitts and Nevis</option>
                                                <option value="LC">Saint Lucia</option>
                                                <option value="MF">Saint Martin</option>
                                                <option value="PM">Saint Pierre and Miquelon</option>
                                                <option value="VC">Saint Vincent and the Grenadines</option>
                                                <option value="WS">Samoa</option>
                                                <option value="SM">San Marino</option>
                                                <option value="ST">Sao Tome and Principe</option>
                                                <option value="SA">Saudi Arabia</option>
                                                <option value="SN">Senegal</option>
                                                <option value="RS">Serbia</option>
                                                <option value="CS">Serbia and Montenegro</option>
                                                <option value="SC">Seychelles</option>
                                                <option value="SL">Sierra Leone</option>
                                                <option value="SG">Singapore</option>
                                                <option value="SX">Sint Maarten</option>
                                                <option value="SK">Slovakia</option>
                                                <option value="SI">Slovenia</option>
                                                <option value="SB">Solomon Islands</option>
                                                <option value="SO">Somalia</option>
                                                <option value="ZA">South Africa</option>
                                                <option value="GS">South Georgia and the South Sandwich Islands
                                                </option>
                                                <option value="SS">South Sudan</option>
                                                <option value="ES">Spain</option>
                                                <option value="LK">Sri Lanka</option>
                                                <option value="SD">Sudan</option>
                                                <option value="SR">Suriname</option>
                                                <option value="SJ">Svalbard and Jan Mayen</option>
                                                <option value="SZ">Swaziland</option>
                                                <option value="SE">Sweden</option>
                                                <option value="CH">Switzerland</option>
                                                <option value="SY">Syrian Arab Republic</option>
                                                <option value="TW">Taiwan, Province of China</option>
                                                <option value="TJ">Tajikistan</option>
                                                <option value="TZ">Tanzania, United Republic of</option>
                                                <option value="TH">Thailand</option>
                                                <option value="TL">Timor-Leste</option>
                                                <option value="TG">Togo</option>
                                                <option value="TK">Tokelau</option>
                                                <option value="TO">Tonga</option>
                                                <option value="TT">Trinidad and Tobago</option>
                                                <option value="TN">Tunisia</option>
                                                <option value="TR">Turkey</option>
                                                <option value="TM">Turkmenistan</option>
                                                <option value="TC">Turks and Caicos Islands</option>
                                                <option value="TV">Tuvalu</option>
                                                <option value="UG">Uganda</option>
                                                <option value="UA">Ukraine</option>
                                                <option value="AE">United Arab Emirates</option>
                                                <option value="GB">United Kingdom</option>
                                                <option value="US">United States</option>
                                                <option value="UM">United States Minor Outlying Islands</option>
                                                <option value="UY">Uruguay</option>
                                                <option value="UZ">Uzbekistan</option>
                                                <option value="VU">Vanuatu</option>
                                                <option value="VE">Venezuela</option>
                                                <option value="VN">Viet Nam</option>
                                                <option value="VG">Virgin Islands, British</option>
                                                <option value="VI">Virgin Islands, U.s.</option>
                                                <option value="WF">Wallis and Futuna</option>
                                                <option value="EH">Western Sahara</option>
                                                <option value="YE">Yemen</option>
                                                <option value="ZM">Zambia</option>
                                                <option value="ZW">Zimbabwe</option>
                                            </select>
                                        </div>
                                        <div class="col-sm-8">

                                            <input name="phoneNumber" id="phoneNumber" placeholder="Phone number">
                                            <span class="text-danger"></span>

                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-1">
                                            <input type="checkbox" checked="">
                                        </div>
                                        <div class="col-9">
                                            <span style="font-size: 14px;">I agree to the user profile <a
                                                    href="https://staging.merchi.co/terms-and-conditions/user/"
                                                    target="_blank">terms &amp; conditions</a>.</span>
                                        </div>
                                    </div>
                                    <div>
                                        <button type="button" onclick="createUser()"
                                            class="w-100 btn btn-primary btn-block">Submit</button>
                                    </div>

                                </div>

                            </div>

                            <input type="button" name="next" class="next action-button" id="hideNextButton" value="Next"
                                style="display: none" />
                            <input type="button" name="previous" class="previous action-button-previous"
                                value="Previous" />
                        </fieldset>
                        <fieldset>
                            <div class="form-card">
                                <div class="row">
                                    <div style="justify-content: center; margin: auto;">
                                        <h2 class="fs-title">Payment details</h2>
                                    </div>
                                </div>
                                <br>
                                <div class="row" style="justify-content: center; margin: auto;">
                                    <div style="col-6">
                                        <label for="">COD Delivery</label><br>
                                    </div>&nbsp;&nbsp;&nbsp;
                                    <div style="col-6">
                                        <input type="radio" id="COD" name="fav_language" value="HTML">
                                    </div>
                                </div>
                                <div class="row" style="justify-content: center; margin: auto;">
                                    <div style="col-6">
                                        <label for="">UPI Payment</label><br>
                                    </div>&nbsp;&nbsp;&nbsp;
                                    <div style="col-6">
                                        <input type="radio" id="UPI" name="fav_language" value="CSS">
                                    </div>
                                </div>
                                <div class="row" style="justify-content: center; margin: auto;">
                                    <div style="col-6">
                                        <label for="">Card Payment</label><br>
                                    </div>&nbsp;&nbsp;&nbsp;
                                    <div style="col-6">
                                        <input type="radio" id="card" name="fav_language" value="HTML">
                                    </div>
                                </div>
                                 
                            </div> <input type="button" name="next" class="next action-button" value="Submit" /> <input
                                type="button" name="previous" class="previous action-button-previous"
                                value="Previous" />
                        </fieldset>
                        <fieldset>
                            <div class="form-card">
                                <div class="row">
                                    <div style="justify-content: center; margin: auto;">
                                        <h2 class="fs-title">Finishs</h2>
                                    </div>
                                </div>
                                <br><br>
                                <h2 class="purple-text text-center"><strong>SUCCESS !</strong></h2> <br>
                                <div class="row justify-content-center">
                                    <div class="col-3">
                                        <!-- <img src="https://i.imgur.com/GwStPmg.png" class="fit-image"> -->
                                        <i class='fas fa-check-circle' style='font-size:100px;color:#50bfd8'></i>
                                    </div>
                                </div> <br><br>
                                <div class="row justify-content-center">
                                    <div class="col-7 text-center">
                                        <h5 class="purple-text text-center"><strong>Order Success.....!</strong></h5>
                                    </div>
                                </div>
                            </div>
                        </fieldset>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <script>
        function saveFormData() {
            const billing_first_name = document.getElementById('billing_first_name').value
            const billing_last_name = document.getElementById('billing_last_name').value
            const billing_company = document.getElementById('billing_company').value
            const billing_country = document.getElementById('billing_country').value
            const billing_address_1 = document.getElementById('billing_address_1').value
            const billing_address_2 = document.getElementById('billing_address_2').value
            const billing_city = document.getElementById('billing_city').value
            const billing_state = document.getElementById('billing_state').value
            const billing_postcode = document.getElementById('billing_postcode').value
            const billing_phone = document.getElementById('billing_phone').value
            const billing_email = document.getElementById('billing_email').value
            const order_comments = document.getElementById('order_comments').value
            const orderData = {
                billing_first_name,
                billing_last_name,
                billing_company,
                billing_country,
                billing_address_1,
                billing_address_2,
                billing_city,
                billing_state,
                billing_postcode,
                billing_phone,
                billing_email,
                order_comments,
            };
            const formDataJSON = JSON.stringify(orderData);
            localStorage.setItem('orderData', formDataJSON);
            var requestOptions = {
                method: 'POST',
                redirect: 'follow'
            };
            fetch(`https://api.staging.merchi.co/v6/user-check-email/?email_address=${billing_email}`, requestOptions)
                .then(response => response.json()) // Parse the response as JSON
                .then(data => {
                    var userId = data.user_id;
                    var divElement = document.getElementById('createUser');
                    var divshipingroup = document.getElementById('divshipingroup');
                    if (userId) {
                        if (divElement) {
                            divElement.style.display = 'none';
                            getShippingGroup();
                            divshipingroup.style.display = 'block';
                         }
                    }else{
                        divElement.style.display = 'block';   
                        divshipingroup.style.display = 'none';
                    }
                    console.log('User ID:', userId);
                })
                .catch(error => console.log('Error', error));
            // Find the "cart-5" cookie    
            const name = 'cart-5';
            const cookies = document.cookie.split(';');
            let cartValue = null;
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.startsWith(name + '=')) {
                    cartValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
            if (cartValue) {
                const values = cartValue.split(',');
                const cartid = values[0];
                const carttoken = values[1];
                var formdata = new FormData();
                formdata.append("receiverAddress-0-lineOne", billing_address_1);
                formdata.append("receiverAddress-0-lineTwo", billing_address_2);
                formdata.append("receiverAddress-0-city", billing_city);
                formdata.append("receiverAddress-0-state", billing_state);
                formdata.append("receiverAddress-0-country", billing_country);
                formdata.append("receiverAddress-0-postcode", billing_postcode);
                formdata.append("receiverAddress-count", "1");
                var requestOptions = {
                    method: 'PATCH',
                    body: formdata,
                    redirect: 'follow'
                };
                fetch(`https://api.staging.merchi.co/v6/carts/${cartid}/?embed=%7B%22cartItems%22%3A%7B%22product%22%3A%7B%22domain%22%3A%7B%22company%22%3A%7B%22defaultTaxType%22%3A%7B%7D%2C%22taxTypes%22%3A%7B%7D%7D%7D%2C%22featureImage%22%3A%7B%7D%2C%22groupVariationFields%22%3A%7B%22options%22%3A%7B%22linkedFile%22%3A%7B%7D%7D%7D%2C%22images%22%3A%7B%7D%2C%22independentVariationFields%22%3A%7B%22options%22%3A%7B%22linkedFile%22%3A%7B%7D%7D%7D%2C%22taxType%22%3A%7B%7D%7D%2C%22taxType%22%3A%7B%7D%2C%22variations%22%3A%7B%22selectedOptions%22%3A%7B%7D%2C%22variationField%22%3A%7B%22options%22%3A%7B%22linkedFile%22%3A%7B%7D%2C%22variationCostDiscountGroup%22%3A%7B%7D%2C%22variationUnitCostDiscountGroup%22%3A%7B%7D%7D%2C%22variationCostDiscountGroup%22%3A%7B%7D%2C%22variationUnitCostDiscountGroup%22%3A%7B%7D%7D%2C%22variationFiles%22%3A%7B%7D%7D%2C%22variationsGroups%22%3A%7B%22variations%22%3A%7B%22selectedOptions%22%3A%7B%7D%2C%22variationField%22%3A%7B%22options%22%3A%7B%22linkedFile%22%3A%7B%7D%2C%22variationCostDiscountGroup%22%3A%7B%7D%2C%22variationUnitCostDiscountGroup%22%3A%7B%7D%7D%2C%22variationCostDiscountGroup%22%3A%7B%7D%2C%22variationUnitCostDiscountGroup%22%3A%7B%7D%7D%2C%22variationFiles%22%3A%7B%7D%7D%7D%7D%2C%22client%22%3A%7B%22emailAddresses%22%3A%7B%7D%2C%22profilePicture%22%3A%7B%7D%7D%2C%22clientCompany%22%3A%7B%7D%2C%22domain%22%3A%7B%22company%22%3A%7B%22defaultTaxType%22%3A%7B%7D%2C%22isStripeAccountEnabled%22%3A%7B%7D%2C%22taxTypes%22%3A%7B%7D%7D%7D%2C%22invoice%22%3A%7B%7D%2C%22receiverAddress%22%3A%7B%7D%2C%22shipmentGroups%22%3A%7B%22cartItems%22%3A%7B%22product%22%3A%7B%7D%7D%2C%22quotes%22%3A%7B%22shipmentMethod%22%3A%7B%22originAddress%22%3A%7B%7D%2C%22taxType%22%3A%7B%7D%7D%7D%2C%22selectedQuote%22%3A%7B%22shipmentMethod%22%3A%7B%22originAddress%22%3A%7B%7D%2C%22taxType%22%3A%7B%7D%7D%7D%7D%7D&skip_rights=y&cart_token=${carttoken}`,
                        requestOptions)
                    .then(response => response.text())
                    .then(result => console.log('update ', result))
                    .catch(error => console.log('error', error));
            } else {
                console.log('Cookie "cart-5" not found or is empty.');
            }
        }
    </script>

    <script>
        function createUser() {
            const username = document.getElementById('username').value;
            const email = document.getElementById('newMail').value;
            const phoneCode = document.getElementById('phoneNumbercode').value;
            const phone = document.getElementById('phoneNumber').value;
            if (username.trim() === '') {
                displayErrorMessage('username', 'Name is required');
                return;
            } else {
                clearErrorMessage('username');
            }
            if (email.trim() === '') {
                displayErrorMessage('newMail', 'Email address is required');
                return;
            } else {
                clearErrorMessage('newMail');
            }
            if (phone.trim() === '') {
                displayErrorMessage('phoneNumber', 'Phone number is required');
                return;
            } else {
                clearErrorMessage('phoneNumber');
            }
            var requestOptions = {
                method: 'POST',
                redirect: 'follow'
            };
            fetch(`https://api.staging.merchi.co/v6/public_user_create/?emailAddresses-0-emailAddress=${email}&emailAddresses-count=1&name=${username}&phoneNumbers-0-code=${phoneCode}&phoneNumbers-0-number=${phone}&phoneNumbers-count=1`,
                    requestOptions)
                .then(response => response.json()) // Parse the response as JSON
                .then(data => {
                    var userId = data.user.id;
                    var divElement = document.getElementById('createUser');
                    var divshipingroup = document.getElementById('divshipingroup');
                    if (userId) {
                        if (divElement) {
                            divElement.style.display = 'none';
                            divshipingroup.style.display = 'block';
                            getShippingGroup();
                        }
                    }else{
                        divElement.style.display = 'blobk';
                        divshipingroup.style.display = 'none';
                    }
                    console.log('User ID:', userId);
                })
                .catch(error => console.log('Error', error));
            document.getElementById('createUser').scrollIntoView({
                behavior: 'smooth'
            });
        }

        function displayErrorMessage(inputId, message) {
            document.getElementById(inputId).nextElementSibling.textContent = message;
            document.getElementById(inputId).nextElementSibling.classList.add('error-message');
        }

        function clearErrorMessage(inputId) {
            document.getElementById(inputId).nextElementSibling.textContent = '';
            document.getElementById(inputId).nextElementSibling.classList.remove('error-message');
        }

        function getShippingGroup() {
            // Find the "cart-5" cookie    
            const name = 'cart-5';
            const cookies = document.cookie.split(';');
            let cartValue = null;
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.startsWith(name + '=')) {
                    cartValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
            //get shipping details 
            if (cartValue) {
                const values = cartValue.split(',');
                const cartid = values[0];
                const carttoken = values[1];
                var requestOptions = {
                    method: 'GET',
                    redirect: 'follow'
                };
                fetch(`https://api.staging.merchi.co/v6/generate-cart-shipment-quotes/${cartid}/?cart_token=${carttoken}`,
                        requestOptions)
                    .then(response => response.text())
                    .then(result => {
                        console.log("from get =>", result);
                        var hideNextButton = document.getElementById('hideNextButton');
                        hideNextButton.style.display = 'block';
                        const parsedResult = JSON.parse(result); // Parse the JSON string
                        var subTotal = parsedResult.cartItemsTotalCost;
                        var shipping = parsedResult.shipmentTotalCost;
                        var totalCost = parsedResult.totalCost;
                        var subtotalSpan = document.getElementById("subtotal");
                        var shippingSpan = document.getElementById("shipping");
                        var totalSpan = document.getElementById("total");
                        // Set the innerHTML of the span elements with the data
                        subtotalSpan.innerHTML = "Subtotal Cost: " + subTotal;
                        shippingSpan.innerHTML = "Shipping Cost: " + shipping;
                        totalSpan.innerHTML = "Total Cost: " + totalCost;
                        const shipmentList = document.getElementById('shipmentList'); // Get the <ul> element
                        const productNamesDiv = document.getElementById("productNames");
                        parsedResult.shipmentGroups.forEach(shipmentGroup => {
                            var shipmentGroupid = shipmentGroup.id;
                            console.log('shipmentGroup id =>', shipmentGroupid);
                            shipmentGroup.cartItems.forEach((cartItem) => {
                                const productName = cartItem.product.name;
                                const productNameElement = document.createElement("p");
                                productNameElement.textContent = productName;
                                productNamesDiv.appendChild(productNameElement);
                            });
                            shipmentGroup.quotes.forEach(quote => {
                                const shipmentMethodName = quote.shipmentMethod.name;
                                const transportCompanyName = quote.shipmentMethod
                                    .transportCompanyName;
                                const totalCost = quote.totalCost;
                                const quoteid = quote.id;
                                console.log('quoteid id =>', quoteid);
                                const listItem = document.createElement('li');
                                listItem.className = 'cursor-pointer list-group-item';
                                listItem.innerHTML = `
                            <div class="shipment-option">
                                <div class="shipment-info">
                                    <p>${shipmentMethodName}</p>
                                    <small>${transportCompanyName}</small>
                                    <div><small class="shipment-price">AUD $${totalCost.toFixed(2)}</small></div>
                                </div>
                                <div>
                                <input type="radio" name="shipmentGroup" data-quote-id="${quote.id}" data-shipment-group-id="${shipmentGroupid}" class="radio-class">
                                </div>
                            </div>`;
                                shipmentList.appendChild(listItem);
                            });
                        });
                        const radioButtons = document.querySelectorAll('.radio-class');
                        radioButtons.forEach(radio => {
                            radio.addEventListener('change', function() {
                                if (this.checked) {
                                    const quoteId = this.getAttribute('data-quote-id');
                                    const shipmentGroupId = this.getAttribute(
                                        'data-shipment-group-id');
                                    console.log(`API function called for quote ID: ${quoteId}`);
                                    console.log(`Shipment Group ID: ${shipmentGroupId}`);
                                    var formdata = new FormData();
                                    formdata.append("shipmentGroups-0-id", shipmentGroupId);
                                    formdata.append("shipmentGroups-0-selectedQuote-0-id", quoteId);
                                    formdata.append("shipmentGroups-0-selectedQuote-count", "1");
                                    formdata.append("shipmentGroups-count:", "1");
                                    var requestOptions = {
                                        method: 'PATCH',
                                        body: formdata,
                                        redirect: 'follow'
                                    };
                                    fetch(`https://api.staging.merchi.co/v6/carts/${cartid}/?embed=%7B%22cartItems%22%3A%7B%22product%22%3A%7B%22domain%22%3A%7B%22company%22%3A%7B%22defaultTaxType%22%3A%7B%7D%2C%22taxTypes%22%3A%7B%7D%7D%7D%2C%22featureImage%22%3A%7B%7D%2C%22groupVariationFields%22%3A%7B%22options%22%3A%7B%22linkedFile%22%3A%7B%7D%7D%7D%2C%22images%22%3A%7B%7D%2C%22independentVariationFields%22%3A%7B%22options%22%3A%7B%22linkedFile%22%3A%7B%7D%7D%7D%2C%22taxType%22%3A%7B%7D%7D%2C%22taxType%22%3A%7B%7D%2C%22variations%22%3A%7B%22selectedOptions%22%3A%7B%7D%2C%22variationField%22%3A%7B%22options%22%3A%7B%22linkedFile%22%3A%7B%7D%2C%22variationCostDiscountGroup%22%3A%7B%7D%2C%22variationUnitCostDiscountGroup%22%3A%7B%7D%7D%2C%22variationCostDiscountGroup%22%3A%7B%7D%2C%22variationUnitCostDiscountGroup%22%3A%7B%7D%7D%2C%22variationFiles%22%3A%7B%7D%7D%2C%22variationsGroups%22%3A%7B%22variations%22%3A%7B%22selectedOptions%22%3A%7B%7D%2C%22variationField%22%3A%7B%22options%22%3A%7B%22linkedFile%22%3A%7B%7D%2C%22variationCostDiscountGroup%22%3A%7B%7D%2C%22variationUnitCostDiscountGroup%22%3A%7B%7D%7D%2C%22variationCostDiscountGroup%22%3A%7B%7D%2C%22variationUnitCostDiscountGroup%22%3A%7B%7D%7D%2C%22variationFiles%22%3A%7B%7D%7D%7D%7D%2C%22client%22%3A%7B%22emailAddresses%22%3A%7B%7D%2C%22profilePicture%22%3A%7B%7D%7D%2C%22clientCompany%22%3A%7B%7D%2C%22domain%22%3A%7B%22company%22%3A%7B%22defaultTaxType%22%3A%7B%7D%2C%22isStripeAccountEnabled%22%3A%7B%7D%2C%22taxTypes%22%3A%7B%7D%7D%7D%2C%22invoice%22%3A%7B%7D%2C%22receiverAddress%22%3A%7B%7D%2C%22shipmentGroups%22%3A%7B%22cartItems%22%3A%7B%22product%22%3A%7B%7D%7D%2C%22quotes%22%3A%7B%22shipmentMethod%22%3A%7B%22originAddress%22%3A%7B%7D%2C%22taxType%22%3A%7B%7D%7D%7D%2C%22selectedQuote%22%3A%7B%22shipmentMethod%22%3A%7B%22originAddress%22%3A%7B%7D%2C%22taxType%22%3A%7B%7D%7D%7D%7D%7D&skip_rights=y&cart_token=${carttoken}`,
                                            requestOptions)
                                        .then(response => response.text())
                                        .then(result => console.log("last update", result))
                                        .catch(error => console.log('error', error));
                                    console.log(`API function called for quote ID: ${quoteId}`);
                                }
                            });
                        });
                    })
                    .catch(error => console.log('error', error));
            }
        }
    </script>

    <?php