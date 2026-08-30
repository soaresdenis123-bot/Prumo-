-- =====================================================================
--  PRUMO · SEED opcional — catálogo de exemplo pro portal do cliente
--  Cria um fornecedor "Catálogo MS (exemplos)" com produtos marcados
--  "no catálogo" em várias categorias. Rode pra testar a personalização
--  sem cadastrar tudo à mão. Pode apagar o fornecedor depois.
--  Seguro rodar mais de uma vez (recria os produtos do exemplo).
-- =====================================================================
do $$
declare fid uuid;
begin
  select id into fid from public.fornecedores where nome = 'Catálogo MS (exemplos)';
  if fid is null then
    insert into public.fornecedores (nome, tipo, categoria, fornece)
    values ('Catálogo MS (exemplos)', 'material', 'Revestimentos', 'Exemplos de catálogo')
    returning id into fid;
  end if;
  delete from public.fornecedor_produtos where fornecedor_id = fid;
  insert into public.fornecedor_produtos (fornecedor_id, produto, categoria, unidade, valor, preco_cliente, no_catalogo) values
    (fid,'Porcelanato acetinado 60x60 Bege','Revestimentos','m²',52,89,true),
    (fid,'Porcelanato amadeirado 20x120','Revestimentos','m²',78,120,true),
    (fid,'Porcelanato marmorizado polido','Revestimentos','m²',95,149,true),
    (fid,'Rodapé poliestireno branco 7cm','Acabamentos','m',9,18,true),
    (fid,'Massa + pintura acetinada premium','Acabamentos','m²',18,32,true),
    (fid,'Luminária pendente cobre','Luminárias','un',110,199,true),
    (fid,'Spot embutir LED redondo','Luminárias','un',9,22,true),
    (fid,'Plafon LED sobrepor 24W','Luminárias','un',28,55,true),
    (fid,'Tinta acrílica premium fosca (18L)','Pintura','lata',260,390,true),
    (fid,'Textura projetada externa','Pintura','m²',22,38,true),
    (fid,'Grama esmeralda em placa','Jardinagem','m²',10,19,true),
    (fid,'Palmeira areca (muda)','Jardinagem','un',45,89,true),
    (fid,'Cuba de apoio cerâmica','Louças / Metais','un',120,220,true),
    (fid,'Torneira monocomando bancada','Louças / Metais','un',180,320,true);
end $$;
