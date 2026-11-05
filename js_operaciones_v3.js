/* ============================================================
   [M4] MÓDULO OPERACIONES — JS Bloque 3 (Guardar Apertura)
   ============================================================ */

window.guardarApertura = function(){
  var grupoEntrante = document.getElementById('opGrupoEntrante').value;
  var grupoSaliente = document.getElementById('opGrupoSaliente').value;
  
  if(!grupoEntrante || !grupoSaliente){
    alert('Debe seleccionar el Grupo Entrante y el Grupo Saliente.');
    return;
  }

  var btn = document.querySelector('button[onclick="guardarApertura()"]');
  if(btn){ btn.disabled = true; btn.textContent = 'Guardando...'; }

  // 1. Recolectar personal
  var personal = [];
  var filas = document.querySelectorAll('#opPersonalContainer table tr');
  for(var i=1; i<filas.length; i++){ // i=1 para saltar el encabezado
    var fila = filas[i];
    var id = fila.querySelector('.opAsistencia').getAttribute('data-id');
    var asistio = fila.querySelector('.opAsistencia').checked;
    var estado = fila.querySelector('.opEstadoOficial').value;
    var resp = fila.querySelector('.opRespOficial').value.trim();
    var nombreTd = fila.querySelector('td').innerHTML;
    
    personal.push({
      id_oficial: id,
      nombre: nombreTd,
      asistio: asistio,
      estado: estado,
      responsabilidades: resp ? resp.split(',').map(function(s){return s.trim()}) : []
    });
  }

  // 2. Recolectar fotos
  var fileEncuadre = document.getElementById('opFotoEncuadre').files[0];
  var filePlanilla = document.getElementById('opFotoPlanilla').files[0];

  var promesasFotos = [];
  
  if(fileEncuadre){
    promesasFotos.push(comprimirImagen(fileEncuadre, 800, 0.6).then(function(b64){ return {nombre: 'encuadre', base64: b64}; }));
  }
  if(filePlanilla){
    promesasFotos.push(comprimirImagen(filePlanilla, 800, 0.6).then(function(b64){ return {nombre: 'planilla', base64: b64}; }));
  }

  Promise.all(promesasFotos).then(function(fotos){
    var fotosObj = {};
    fotos.forEach(function(f){ fotosObj['foto_' + f.nombre] = f.base64; });

    // 3. Armar el objeto a guardar
    var data = {
      fechaApertura: firebase.firestore.FieldValue.serverTimestamp(),
      grupo: grupoEntrante,
      grupoSaliente: grupoSaliente,
      jefe: 'Por asignar', // Aquí se puede mejorar sacando el jefe del grupo
      estado: 'abierto',
      personal: personal,
      instalaciones: document.getElementById('opEstadoInstalaciones').value.trim(),
      novedades: document.getElementById('opNovedades').value.trim(),
      observaciones: document.getElementById('opObservaciones').value.trim(),
      foto_encuadre: fotosObj['foto_encuadre'] || '',
      foto_planilla: fotosObj['foto_planilla'] || '',
      creadoPor: window.SIGR.usuario.email,
      fechaRegistro: firebase.firestore.FieldValue.serverTimestamp()
    };

    // 4. Guardar en Firebase
    return db.collection('servicio').add(data);
  }).then(function(ref){
    alert('¡Servicio aperturado y guardado con éxito!');
    cerrarModal('modalApertura');
    cargarOperaciones(); // Recargar la tabla
    if(btn){ btn.disabled = false; btn.textContent = 'Guardar Apertura'; }
  }).catch(function(e){
    console.error('Error guardando servicio:', e);
    alert('Error al guardar: ' + e.message);
    if(btn){ btn.disabled = false; btn.textContent = 'Guardar Apertura'; }
  });
};
