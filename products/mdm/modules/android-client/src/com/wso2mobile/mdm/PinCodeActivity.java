package com.wso2mobile.mdm;


import android.os.Bundle;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.KeyEvent;
import android.view.Menu;
import android.view.View;
import android.view.View.OnClickListener;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

public class PinCodeActivity extends Activity {
	private TextView lblPin;
	private EditText txtPin;
	private EditText txtOldPin;
	private Button btnPin;
	private String EMAIL = null;
	private String REG_ID = "";
	private final int TAG_BTN_SET_PIN = 0;
	private String FROM_ACTIVITY = null;
	private String MAIN_ACTIVITY = null;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_pin_code);

		Bundle extras = getIntent().getExtras();
		if (extras != null) {
			if (extras.containsKey(getResources().getString(R.string.intent_extra_email))) {
				EMAIL = extras.getString(getResources().getString(R.string.intent_extra_email));
			}

			if (extras.containsKey(getResources().getString(R.string.intent_extra_regid))) {
				REG_ID = extras.getString(getResources().getString(R.string.intent_extra_regid));
			}
			
			if(extras.containsKey(getResources().getString(R.string.intent_extra_from_activity))){
				FROM_ACTIVITY = extras.getString(getResources().getString(R.string.intent_extra_from_activity));
			}
			
			if(extras.containsKey(getResources().getString(R.string.intent_extra_main_activity))){
				MAIN_ACTIVITY = extras.getString(getResources().getString(R.string.intent_extra_main_activity));
			}
		}
		
		lblPin = (TextView) findViewById(R.id.lblPin);
		txtPin = (EditText) findViewById(R.id.txtPinCode);
		txtOldPin = (EditText) findViewById(R.id.txtOldPinCode);
		btnPin = (Button) findViewById(R.id.btnSetPin);
		btnPin.setTag(TAG_BTN_SET_PIN);
		btnPin.setOnClickListener(onClickListener_BUTTON_CLICKED);
		btnPin.setEnabled(false);
		
		if(FROM_ACTIVITY != null && FROM_ACTIVITY.equals(AlreadyRegisteredActivity.class.getSimpleName())){
			lblPin.setVisibility(View.GONE);
			txtOldPin.setVisibility(View.VISIBLE);
			txtPin.setHint(getResources().getString(R.string.hint_new_pin));
			txtPin.setEnabled(false);
			
			txtPin.addTextChangedListener(new TextWatcher() {
				@Override
				public void beforeTextChanged(CharSequence s, int start, int count,
						int after) {
				}

				@Override
				public void onTextChanged(CharSequence s, int start, int before,
						int count) {
					enableNewPINSubmitIfReady();
				}

				@Override
				public void afterTextChanged(Editable s) {
					// TODO Auto-generated method stub
					enableSubmitIfReady();
				}
			});
			
			txtOldPin.addTextChangedListener(new TextWatcher() {
				@Override
				public void beforeTextChanged(CharSequence s, int start, int count,
						int after) {
				}

				@Override
				public void onTextChanged(CharSequence s, int start, int before,
						int count) {
					enableNewPINSubmitIfReady();
				}

				@Override
				public void afterTextChanged(Editable s) {
					// TODO Auto-generated method stub
					enableSubmitIfReady();
				}
			});
		}else{
			txtPin.addTextChangedListener(new TextWatcher() {
				@Override
				public void beforeTextChanged(CharSequence s, int start, int count,
						int after) {
				}

				@Override
				public void onTextChanged(CharSequence s, int start, int before,
						int count) {
					enableSubmitIfReady();
				}

				@Override
				public void afterTextChanged(Editable s) {
					// TODO Auto-generated method stub
					enableSubmitIfReady();
				}
			});
		}
	}

	OnClickListener onClickListener_BUTTON_CLICKED = new OnClickListener() {

		@Override
		public void onClick(View view) {
			// TODO Auto-generated method stub

			int iTag = (Integer) view.getTag();

			switch (iTag) {

			case TAG_BTN_SET_PIN:
				AlertDialog.Builder builder = new AlertDialog.Builder(
						PinCodeActivity.this);
				builder.setMessage(
						getResources().getString(R.string.dialog_pin_confirmation)
								+ " " +txtPin.getText().toString() + " " 
								+ getResources().getString(R.string.dialog_pin_confirmation_end))
						.setPositiveButton(getResources().getString(R.string.info_label_rooted_answer_yes), dialogClickListener)
						.setNegativeButton(getResources().getString(R.string.info_label_rooted_answer_no), dialogClickListener).show();
				break;
			default:
				break;
			}

		}
	};

	DialogInterface.OnClickListener dialogClickListener = new DialogInterface.OnClickListener() {
		@Override
		public void onClick(DialogInterface dialog, int which) {
			switch (which) {
			case DialogInterface.BUTTON_POSITIVE:
				savePin();
				break;

			case DialogInterface.BUTTON_NEGATIVE:
				dialog.dismiss();
				break;
			}
		}
	};

	public void savePin() {

		SharedPreferences mainPref = this.getSharedPreferences(getResources().getString(R.string.shared_pref_package),
				Context.MODE_PRIVATE);
		Editor editor = mainPref.edit();
		editor.putString(getResources().getString(R.string.shared_pref_pin), txtPin.getText().toString().trim());
		editor.commit();

		if(FROM_ACTIVITY != null && (FROM_ACTIVITY.equals(AlreadyRegisteredActivity.class.getSimpleName()))){
			Toast.makeText(getApplicationContext(), getResources().getString(R.string.toast_message_pin_change_success), Toast.LENGTH_SHORT).show();
			Intent intent = new Intent(PinCodeActivity.this,AlreadyRegisteredActivity.class);
    		intent.putExtra(getResources().getString(R.string.intent_extra_from_activity), PinCodeActivity.class.getSimpleName());
    		intent.putExtra(getResources().getString(R.string.intent_extra_regid), REG_ID);
    		startActivity(intent);
		}else{
			Intent intent = new Intent(PinCodeActivity.this, MainActivity.class);
			intent.putExtra(getResources().getString(R.string.intent_extra_regid), REG_ID);
			intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
			intent.putExtra(getResources().getString(R.string.intent_extra_email), EMAIL);
			startActivity(intent);
		}
	}

	public void enableSubmitIfReady() {

		boolean isReady = false;

		if (txtPin.getText().toString().length() >= 4) {
			isReady = true;
		}

		if (isReady) {
			btnPin.setEnabled(true);
		} else {
			btnPin.setEnabled(false);
		}
	}
	
	public void enableNewPINSubmitIfReady() {

		boolean isReady = false;
		SharedPreferences mainPref = this.getSharedPreferences(getResources().getString(R.string.shared_pref_package),
				Context.MODE_PRIVATE);
		String pin = mainPref.getString(getResources().getString(R.string.shared_pref_pin), "");
		if(txtOldPin.getText().toString().trim().length() >= 4 && txtOldPin.getText().toString().trim().equals(pin.trim())){
			txtPin.setEnabled(true);
		}else{
			txtPin.setEnabled(false);
		}
		
		if (txtPin.getText().toString().trim().length() >= 4 && txtOldPin.getText().toString().trim().length() >= 4) {
			if(txtOldPin.getText().toString().trim().equals(pin.trim())){
				isReady = true;
			}else{
				isReady = false;
				Toast.makeText(getApplicationContext(), getResources().getString(R.string.toast_message_pin_change_failed), Toast.LENGTH_SHORT).show();
			}
		}
		
		if (isReady) {
			btnPin.setEnabled(true);
		} else {
			btnPin.setEnabled(false);
		}
	}
	
	@Override
	public boolean onKeyDown(int keyCode, KeyEvent event) {
		if (keyCode == KeyEvent.KEYCODE_BACK && FROM_ACTIVITY != null && FROM_ACTIVITY.equals(AlreadyRegisteredActivity.class.getSimpleName())) {
    		Intent intent = new Intent(PinCodeActivity.this,AlreadyRegisteredActivity.class);
    		intent.putExtra(getResources().getString(R.string.intent_extra_from_activity), PinCodeActivity.class.getSimpleName());
    		intent.putExtra(getResources().getString(R.string.intent_extra_regid), REG_ID);
    		startActivity(intent);
    		return true;
	    }else if (keyCode == KeyEvent.KEYCODE_BACK) {
	    	Intent i = new Intent();
	    	i.setAction(Intent.ACTION_MAIN);
	    	i.addCategory(Intent.CATEGORY_HOME);
	    	this.startActivity(i);
	    	this.finish();
	        return true;
	    }
	    return super.onKeyDown(keyCode, event);
	}

	@Override
	public boolean onCreateOptionsMenu(Menu menu) {
		// Inflate the menu; this adds items to the action bar if it is present.
		// getMenuInflater().inflate(R.menu.pin_code, menu);
		return true;
	}

}
