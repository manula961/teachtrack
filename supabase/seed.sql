-- Optional competition/demo data. Run AFTER schema.sql.
insert into public.teachers (id,name,initials,subject,department,email,experience,qualification,skills,join_date,status,milestones) values
(1,'Maya Fernando','MF','Mathematics','STEM','maya@teachtrack.edu',8,'B.Sc. Mathematics, PGDE',array['Assessment Design','EdTech','Mentoring'],'2018-01-15','Active',array['Promoted to Senior Teacher','Mentored 3 new teachers']),
(2,'Nimal Perera','NP','Science','STEM','nimal@teachtrack.edu',6,'B.Sc. Biological Science',array['Lab Safety','Project Learning'],'2020-05-10','Active',array['Science Fair Coordinator']),
(3,'Ayesha Silva','AS','English','Languages','ayesha@teachtrack.edu',10,'B.A. English, M.Ed.',array['Literacy','Drama','Curriculum'],'2016-02-12','Active',array['Outstanding Teacher Award 2025']),
(4,'Kasun Jayasinghe','KJ','ICT','Technology','kasun@teachtrack.edu',4,'B.Sc. IT',array['Web Development','Robotics'],'2022-03-21','Active',array['Launched Coding Club']),
(5,'Dinithi Rodrigo','DR','History','Humanities','dinithi@teachtrack.edu',7,'B.A. History, PGDE',array['Research','Debate'],'2019-07-03','Active',array['History Exhibition Lead']),
(6,'Ruwan Wickramasinghe','RW','Physical Education','Wellbeing','ruwan@teachtrack.edu',9,'B.Ed. Physical Education',array['Coaching','First Aid'],'2017-01-08','Active',array['District Sports Championship Coach'])
on conflict(id) do nothing;

insert into public.attendance(id,teacher_id,date,status,arrival_time) values
(1,1,'2026-08-24','Present','07:34'),(2,2,'2026-08-24','Late','08:06'),(3,3,'2026-08-24','Present','07:28'),(4,4,'2026-08-24','Present','07:45'),
(5,5,'2026-08-24','Absent',null),(6,6,'2026-08-24','Present','07:39'),(7,1,'2026-08-25','Present','07:31'),(8,2,'2026-08-25','Present','07:42'),
(9,3,'2026-08-25','Present','07:30'),(10,4,'2026-08-25','Late','08:10'),(11,5,'2026-08-25','Present','07:50'),(12,6,'2026-08-25','Present','07:32')
on conflict do nothing;

insert into public.training(id,title,provider,teacher_id,date,hours,status,certificate_verified) values
(1,'AI Tools for Educators','National Teacher Academy',1,'2026-07-14',8,'Completed',true),
(2,'Inclusive Classroom Strategies','EduGrowth Institute',3,'2026-07-22',12,'Completed',true),
(3,'Modern Assessment Design','LearnLab',2,'2026-08-05',6,'Completed',true),
(4,'Cyber Safety for Schools','Digital Futures',4,'2026-09-10',5,'Upcoming',false),
(5,'Student Wellbeing Essentials','Mindful Schools',6,'2026-08-30',7,'In Progress',false),
(6,'Project-Based Learning','EduGrowth Institute',5,'2026-06-18',10,'Completed',true)
on conflict(id) do nothing;

insert into public.feedback(id,teacher_id,source,category,rating,comment,date) values
(1,1,'Student','Clarity',5,'Explains difficult ideas clearly and patiently.','2026-08-18'),
(2,3,'Management','Leadership',5,'Consistently supports colleagues and leads curriculum planning.','2026-08-20'),
(3,4,'Student','Engagement',4,'Coding activities are fun and practical.','2026-08-21'),
(4,2,'Peer','Collaboration',4,'Reliable team member with strong subject knowledge.','2026-08-22'),
(5,5,'Student','Support',5,'Makes history feel connected to real life.','2026-08-23')
on conflict(id) do nothing;

insert into public.lessons(id,teacher_id,title,subject,grade,date,status,objective) values
(1,1,'Quadratic Functions in Real Life','Mathematics','Grade 10','2026-08-29','Approved','Model real-life relationships using quadratic functions.'),
(2,3,'Persuasive Writing Workshop','English','Grade 9','2026-08-30','Approved','Build evidence-based persuasive arguments.'),
(3,4,'Build Your First Web Page','ICT','Grade 8','2026-09-01','Draft','Create a semantic HTML page with basic CSS.'),
(4,2,'Cells Under the Microscope','Science','Grade 7','2026-08-31','Pending','Identify key structures in plant and animal cells.'),
(5,5,'Ancient Trade Routes','History','Grade 8','2026-09-02','Approved','Explain how trade shaped cultural exchange.')
on conflict(id) do nothing;

insert into public.achievements(id,teacher_id,badge,icon,description,date) values
(1,3,'Excellence Star','🌟','Maintained a feedback score above 4.8','2026-08-20'),
(2,1,'Training Champion','🎓','Completed 40+ professional development hours','2026-08-18'),
(3,6,'Attendance Hero','⏰','Maintained attendance above 97%','2026-08-15'),
(4,4,'Innovation Spark','💡','Introduced a new coding activity','2026-08-12')
on conflict(id) do nothing;

insert into public.goals(id,teacher_id,title,category,target_value,current_value,unit,due_date,status) values
(1,1,'Complete advanced assessment certification','Professional Development',20,14,'hours','2026-10-15','Active'),
(2,3,'Raise student writing mastery','Student Outcomes',90,84,'%','2026-11-30','Active'),
(3,4,'Launch robotics project showcase','Innovation',1,1,'project','2026-08-20','Completed'),
(4,2,'Improve punctuality consistency','Attendance',98,94,'%','2026-09-30','At Risk')
on conflict(id) do nothing;

insert into public.observations(id,teacher_id,observer_name,date,rating,focus_area,notes,status) values
(1,1,'Sarah Admin','2026-08-06',4.8,'Questioning & differentiation','Strong checks for understanding and differentiated extension tasks.','Completed'),
(2,4,'Sarah Admin','2026-08-12',4.4,'Student engagement','Excellent practical activity; add more structured reflection at the end.','Follow-up'),
(3,3,'Sarah Admin','2026-08-19',4.9,'Classroom discussion','High-quality facilitation and inclusive participation routines.','Completed')
on conflict(id) do nothing;

insert into public.development_recommendations(id,teacher_id,title,recommendation,priority,status) values
(1,4,'Deepen reflective lesson closure','Add a 5-minute reflection protocol to practical ICT lessons and review student exit-ticket evidence monthly.','Medium','Suggested'),
(2,2,'Punctuality improvement plan','Use a weekly arrival dashboard and set a 97% on-time target for the next appraisal cycle.','High','Accepted'),
(3,1,'Leadership pathway','Lead one cross-department assessment workshop and mentor a beginning teacher this term.','Low','Suggested')
on conflict(id) do nothing;

-- Keep identity sequences ahead of seeded IDs.
select setval(pg_get_serial_sequence('public.teachers','id'), coalesce((select max(id) from public.teachers),1));
select setval(pg_get_serial_sequence('public.attendance','id'), coalesce((select max(id) from public.attendance),1));
select setval(pg_get_serial_sequence('public.training','id'), coalesce((select max(id) from public.training),1));
select setval(pg_get_serial_sequence('public.feedback','id'), coalesce((select max(id) from public.feedback),1));
select setval(pg_get_serial_sequence('public.lessons','id'), coalesce((select max(id) from public.lessons),1));
select setval(pg_get_serial_sequence('public.achievements','id'), coalesce((select max(id) from public.achievements),1));
select setval(pg_get_serial_sequence('public.goals','id'), coalesce((select max(id) from public.goals),1));
select setval(pg_get_serial_sequence('public.observations','id'), coalesce((select max(id) from public.observations),1));
select setval(pg_get_serial_sequence('public.development_recommendations','id'), coalesce((select max(id) from public.development_recommendations),1));
