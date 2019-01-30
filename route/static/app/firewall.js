setTimeout(function(){
	getSshInfo();
},500);
	
setTimeout(function(){
	showAccept(1);
},1000);

setTimeout(function(){
	getLogs(1);
},1500);

	
$(function(){
	// start 
	$.post('/firewall/get_www_path',function(data){
		var html ='<a href="javascript:openPath(\''+data['path']+'\');">日志目录</a>\
				<em id="logSize">0KB</em>\
				<button class="btn btn-default btn-sm" onclick="closeLogs();">清空</button>';
		$('#firewall_weblog').html(html);

		$.post('/files/get_dir_size','path='+data['path'], function(rdata){
			$("#logSize").html(rdata.msg);
		},'json');
	},'json');
	// end
});

function closeLogs(){
	$.post('/files?action=CloseLogs','',function(rdata){
		$("#logSize").html(rdata.msg);
		layer.msg(lan.firewall.empty,{icon:1});
	},'json');
}

$("#firewalldType").change(function(){
	var type = $(this).val();
	var w = '120px';
	var p = lan.firewall.port;
	var t = lan.firewall.accept;
	var m = lan.firewall.port_ps;
	if(type == 'address'){
		w = '150px';
		p = lan.firewall.ip;
		t = lan.firewall.drop;
		m = lan.firewall.ip_ps;
	}
	$("#AcceptPort").css("width",w);
	$("#AcceptPort").attr('placeholder',p);
	$("#toAccept").html(t);
	$("#f-ps").html(m);
	 
});


function getSshInfo(){
	$.post('/firewall/get_ssh_info', '', function(rdata){
		// console.log(rdata);
		var SSHchecked = ''
		if(rdata.status){
			SSHchecked = "<input class='btswitch btswitch-ios' id='sshswitch' type='checkbox' checked><label class='btswitch-btn' for='sshswitch' onclick='setMstscStatus()'></label>";
		} else {
			SSHchecked = "<input class='btswitch btswitch-ios' id='sshswitch' type='checkbox'><label class='btswitch-btn' for='sshswitch' onclick='setMstscStatus()'></label>";
			$("#mstscSubmit").attr('disabled','disabled');
			$("#mstscPort").attr('disabled','disabled');
		}
		
		$("#in_safe").html(SSHchecked);
		$("#mstscPort").val(rdata.port);
		var isPint = '';
		if(rdata.ping){
			isPing = "<input class='btswitch btswitch-ios' id='noping' type='checkbox'><label class='btswitch-btn' for='noping' onclick='ping(1)'></label>";
		}else{
			isPing = "<input class='btswitch btswitch-ios' id='noping' type='checkbox' checked><label class='btswitch-btn' for='noping' onclick='ping(0)'></label>";
		}
		$("#is_ping").html(isPing);

		// console.log(rdata.firewall_status);
		var fStatus = '';
		if (rdata.firewall_status){
			fStatus = "<input class='btswitch btswitch-ios' id='firewall_status' type='checkbox' checked><label class='btswitch-btn' for='firewall_status' ></label>";
		}else{
			fStatus = "<input class='btswitch btswitch-ios' id='firewall_status' type='checkbox'><label class='btswitch-btn' for='firewall_status' ></label>";
		}
		$("#firewall_status").html(fStatus);
		
	},'json');
}


/**
 * 修改远程端口
 */

function mstsc(port) {
	layer.confirm('更改远程端口时，将会注消所有已登录帐户，您真的要更改远程端口吗？', {title: '远程端口'}, function(index) {
		var data = "port=" + port;
		var loadT = layer.load({
			shade: true,
			shadeClose: false
		});
		$.post('/firewall?action=SetSshPort', data, function(ret) {
			layer.msg(ret.msg,{icon:ret.status?1:2})
			layer.close(loadT);
			getSshInfo();
		});
	});
}

/**
 * 更改禁ping状态
 * @param {Int} state 0.禁ping 1.可ping
 */
function ping(status){
	var msg = status == 1 ? '禁PING后不影响服务器正常使用，但无法ping通服务器，您真的要禁PING吗？' : '解除禁PING状态可能会被黑客发现您的服务器，您真的要解禁吗？';
	layer.confirm(msg,{title:'是否禁ping',closeBtn:2,cancel:function(){
		if(status == 1){
			$("#noping").prop("checked",true);
		} else {
			$("#noping").prop("checked",false);
		}
	}},function(){
		layer.msg('正在处理,请稍候...',{icon:16,time:20000});
		$.post('/firewall/set_ping','status='+status, function(data) {
			layer.closeAll();
			if (data['status'] == true) {
				if(status == 1){
					layer.msg(data['msg'], {icon: 1});
				} else {
					layer.msg('已解除禁PING', {icon: 1});
				}
				setTimeout(function(){window.location.reload();},3000);
			} else {
				layer.msg('连接服务器失败', {icon: 2});
			}
		},'json');
	},function(){
		if(status == 1){
			$("#noping").prop("checked",true);
		} else {
			$("#noping").prop("checked",false);
		}
	});
}



/**
 * 设置远程服务状态
 * @param {Int} state 0.启用 1.关闭
 */
function setMstscStatus(){
	status = $("#sshswitch").prop("checked")==true?1:0;
	var msg = status==1?'停用SSH服务的同时也将注销所有已登录用户,继续吗？':'确定启用SSH服务吗？';
	layer.confirm(msg,{title:'警告',closeBtn:2,cancel:function(){
		if(status == 0){
			$("#sshswitch").prop("checked",false);
		}
		else{
			$("#sshswitch").prop("checked",true);
		}
	}},function(index){
		if(index > 0){
			layer.msg('正在处理,请稍候...',{icon:16,time:20000});
			$.post('/firewall?action=SetSshStatus','status='+status,function(rdata){
				layer.closeAll();
				layer.msg(rdata.msg,{icon:rdata.status?1:2});
				refresh();
			},'json');
		}
	},function(){
		if(status == 0){
			$("#sshswitch").prop("checked",false);
		} else {
			$("#sshswitch").prop("checked",true);
		}
	});
}

/**
 * 取回数据
 * @param {Int} page  分页号
 */
function showAccept(page,search) {
	search = search == undefined ? '':search;
	var loadT = layer.load();
	$.post('/firewall/get_list','limit=10&p=' + page+"&search="+search, function(data) {
		layer.close(loadT);
		var body = '';
		for (var i = 0; i < data.data.length; i++) {
			var status = '';
			switch(data.data[i].status){
				case 0:
					status = '未使用';
					break;
				case 1:
					status = '外网不通';
					break;
				default:
					status = '正常';
					break;
			}
			body += "<tr>\
						<td><em class='dlt-num'>" + data.data[i].id + "</em></td>\
						<td>" + (data.data[i].port.indexOf('.') == -1?lan.firewall.accept_port+':['+data.data[i].port+']':lan.firewall.drop_ip+':['+data.data[i].port+']') + "</td>\
						<td>" + status + "</td>\
						<td>" + data.data[i].addtime + "</td>\
						<td>" + data.data[i].ps + "</td>\
						<td class='text-right'><a href='javascript:;' class='btlink' onclick=\"delAcceptPort(" + data.data[i].id + ",'" + data.data[i].port + "')\">删除</a></td>\
					</tr>";
		}
		$("#firewallBody").html(body);
		$("#firewallPage").html(data.page);
	},'json');
}

//添加放行
function addAcceptPort(){
	var type = $("#firewalldType").val();
	var port = $("#AcceptPort").val();
	var ps = $("#Ps").val();
	var action = "AddDropAddress";
	if(type == 'port'){
		ports = port.split(':');
		for(var i=0;i<ports.length;i++){
			if(isNaN(ports[i]) || ports[i] < 1 || ports[i] > 65535 ){
				layer.msg('端口范围不合法!',{icon:5});
				return;
			}
		}
		action = "AddAcceptPort";
	}
	
	
	if(ps.length < 1){
		layer.msg('备注/说明 不能为空!',{icon:2});
		$("#Ps").focus();
		return;
	}
	var loadT = layer.msg('正在添加,请稍候...',{icon:16,time:0,shade: [0.3, '#000']})
	$.post('/firewall?action='+action,'port='+port+"&ps="+ps+'&type='+type,function(rdata){
		layer.close(loadT);
		if(rdata.status == true || rdata.status == 'true'){
			layer.msg(rdata.msg,{icon:1});
			ShowAccept(1);
			$("#AcceptPort").val('');
			$("#Ps").val('');
		}else{
			layer.msg(rdata.msg,{icon:2});
		}
		
		$("#AcceptPort").attr('value','');
		$("#Ps").attr('value','');
	},'json');
}

//删除放行
function delAcceptPort(id, port) {
	var action = "DelDropAddress";
	if(port.indexOf('.') == -1){
		action = "DelAcceptPort";
	}
	
	layer.confirm(lan.get('confirm_del',[port]), {title: '删除防火墙规则',closeBtn:2}, function(index) {
		var loadT = layer.msg('正在删除,请稍候...',{icon:16,time:0,shade: [0.3, '#000']})
		$.post("/firewall?action="+action,"id=" + id + "&port=" + port, function(ret) {
			layer.close(loadT);
			layer.msg(ret.msg,{icon:ret.status?1:2})
			ShowAccept(1);
		});
	});
}


/**
 * 取回数据
 * @param {Int} page  分页号
 */
function getLogs(page,search) {
	search = search == undefined ? '':search;
	var loadT = layer.load();
	$.post('/firewall/get_log_list','limit=10&p=' + page+"&search="+search, function(data) {
		layer.close(loadT);
		var body = '';
		for (var i = 0; i < data.data.length; i++) {
			body += "<tr>\
						<td><em class='dlt-num'>" + data.data[i].id + "</em></td>\
						<td>" + data.data[i].type + "</td>\
						<td>" + data.data[i].log + "</td>\
						<td>" + data.data[i].addtime + "</td>\
					</tr>";
		}
		$("#logsBody").html(body);
		$("#logsPage").html(data.page);
	},'json');
}

//清理面板日志
function delLogs(){
	layer.confirm('即将清空面板日志，继续吗？',{title:'清空日志',closeBtn:2},function(){
		var loadT = layer.msg('正在清理,请稍候...',{icon:16});
		$.post('/ajax?action=delClose','',function(rdata){
			layer.close(loadT);
			layer.msg(rdata.msg,{icon:rdata.status?1:2});
			getLogs(1);
		});
	});
}